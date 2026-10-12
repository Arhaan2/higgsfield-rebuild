import type { Asset, Project, Job, Snapshot, JobStatus, Draft } from "../contracts/studio";
import { PRESETS, SAMPLE_ASSETS, SAMPLE_HASHES } from "../catalog/samples";
import { Fault, iso, sha256, type Config } from "./http";
export type Runtime = { db: D1Database; bucket: R2Bucket; config: Config; fetcher: typeof fetch; now: () => number };
export type GuestRow = { id:string; token_hash:string; created_at:number; expires_at:number };
export type ProjectRow = { id:string; guest_id:string; title:string; draft_json:string; revision:number; preferred_asset_id:string|null; created_at:number; updated_at:number };
export type AssetRow = { id:string; guest_id:string; project_id:string; source:"upload"|"generation"; kind:"image"|"video"; object_key:string; file_name:string; mime_type:Asset["mimeType"]; byte_size:number; width:number|null; height:number|null; duration_ms:number|null; sha256:string; source_job_id:string|null; created_at:number };
export type JobRow = { id:string; guest_id:string; project_id:string; request_key:string; requested_revision:number; submit_hash:string; snapshot_json:string; status:JobStatus; provider_request_id:string|null; provider_status_url:string|null; provider_result_url:string|null; provider_output_json:string|null; actual_metadata_json:string|null; output_asset_id:string|null; error_code:string|null; error_message:string|null; reserve_micro_usd:number; accounting_state:"held"|"committed"|"released"; lease_token:string|null; lease_expires_at:number|null; next_poll_at:number|null; last_checked_at:number|null; created_at:number; updated_at:number };
export type Reservation = { id:string; guest_id:string; project_id:string; asset_id:string; job_id:string|null; bytes:number; state:"held"|"stored"|"released"; content_sha256:string|null; content_mime_type:string|null; lease_token:string|null; lease_expires_at:number|null; created_at:number; updated_at:number };
export const stmt = (rt:Runtime, sql:string,...args: unknown[]) => rt.db.prepare(sql).bind(...args);
export const one = <T>(rt:Runtime, sql:string,...args: unknown[]) => stmt(rt,sql,...args).first<T>();
export async function all<T>(rt:Runtime, sql:string,...args: unknown[]) { return (await stmt(rt,sql,...args).all<T>()).results; }
export function cookieName(config:Config) { return config.origin?.startsWith("http:") ? "studio_guest" : "__Host-studio_guest"; }
export async function guest(rt:Runtime, request:Request, required=true) {
  const name=cookieName(rt.config); const raw=(request.headers.get("Cookie") || "").split(";").map(s=>s.trim()).filter(s=>s.startsWith(`${name}=`));
  const token=raw.length===1 ? raw[0].slice(name.length+1) : "";
  const found=/^[A-Za-z0-9_-]{43}$/.test(token) ? await one<GuestRow>(rt,"SELECT * FROM guests WHERE token_hash = ? AND expires_at > ?",await sha256(token),rt.now()) : null;
  if (!found && required) throw new Fault(401,"GUEST_REQUIRED","Start a guest session to save your work. Guest access lasts 30 days in this browser.");
  return found;
}
export async function rate(rt:Runtime, scope:string, subject:string, limit:number, windowMs:number) {
  const now=rt.now(), start=Math.floor(now/windowMs)*windowMs;
  const result=await rt.db.batch([
    stmt(rt,"DELETE FROM rate_buckets WHERE window_start < ?",now-7200000),
    stmt(rt,`INSERT INTO rate_buckets (scope,subject,window_start,count) VALUES (?,?,?,1)
      ON CONFLICT(scope,subject,window_start) DO UPDATE SET count=count+1 WHERE count < ? RETURNING count`,scope,subject,start,limit),
  ]);
  if (!result[1].results.length) throw new Fault(429,"RATE_LIMITED","Too many requests. Give this a moment and try again.",undefined,Math.ceil((start+windowMs-now)/1000));
}
export async function ownedProject(rt:Runtime, owner:string,id:string) {
  const p=await one<ProjectRow>(rt,"SELECT * FROM projects WHERE id = ? AND guest_id = ?",id,owner);
  if (!p) throw new Fault(404,"NOT_FOUND","This project is unavailable."); return p;
}
export async function ownedJob(rt:Runtime, owner:string,id:string) {
  const j=await one<JobRow>(rt,"SELECT * FROM jobs WHERE id = ? AND guest_id = ?",id,owner);
  if (!j) throw new Fault(404,"NOT_FOUND","This job is unavailable."); return j;
}
export async function ownedAsset(rt:Runtime, owner:string,id:string) {
  const a=await one<AssetRow>(rt,"SELECT * FROM assets WHERE id = ? AND guest_id = ?",id,owner);
  if (!a) throw new Fault(404,"NOT_FOUND","This asset is unavailable."); return a;
}
export const publicSample = (id:string) => SAMPLE_ASSETS.find(a=>a.id===id);
export function projectDTO(p:ProjectRow):Project { return { id:p.id,title:p.title,draft:JSON.parse(p.draft_json) as Draft,revision:p.revision,preferredAssetId:p.preferred_asset_id,createdAt:iso(p.created_at),updatedAt:iso(p.updated_at) }; }
export function assetDTO(a:AssetRow):Asset { return { id:a.id,projectId:a.project_id,title:a.file_name,kind:a.kind,source:a.source,fileName:a.file_name,mimeType:a.mime_type,byteSize:a.byte_size,width:a.width,height:a.height,durationSeconds:a.duration_ms===null?null:a.duration_ms/1000,sourceJobId:a.source_job_id,mediaUrl:`/api/assets/${a.id}/media`,downloadUrl:`/api/assets/${a.id}/download`,posterUrl:null,attribution:null,createdAt:iso(a.created_at) }; }
export function jobDTO(j:JobRow,now:number):Job {
  const recovery = j.status === "submission_unknown" ? (j.provider_request_id ? "refresh" : "contact_owner") : j.status === "transfer_failed" ? "retry_transfer" : j.status === "failed" ? "revise" : "refresh";
  return { id:j.id,projectId:j.project_id,requestKey:j.request_key,status:j.status,snapshot:JSON.parse(j.snapshot_json) as Snapshot,outputAssetIds:j.output_asset_id?[j.output_asset_id]:[],resultMetadata:j.actual_metadata_json?JSON.parse(j.actual_metadata_json):null,error:j.error_code?{code:j.error_code,message:j.error_message || "The request needs attention.",recovery}:null,nextPollAfterMs:j.next_poll_at===null?null:Math.max(0,j.next_poll_at-now),lastCheckedAt:j.last_checked_at===null?null:iso(j.last_checked_at),createdAt:iso(j.created_at),updatedAt:iso(j.updated_at) };
}
export async function validateReferences(rt:Runtime,owner:string,draft:Draft) {
  if (draft.presetId !== null && !PRESETS.some(p=>p.id===draft.presetId && p.operation===draft.operation)) throw new Fault(422,"VALIDATION_FAILED","Choose a preset for this operation.",{presetId:"This preset does not match the selected operation."});
  if (draft.parentAssetId) { if (!publicSample(draft.parentAssetId)) await ownedAsset(rt,owner,draft.parentAssetId); }
  if (draft.operation === "image_to_video" && draft.startAssetId) {
    const a=publicSample(draft.startAssetId) || assetDTO(await ownedAsset(rt,owner,draft.startAssetId));
    if (a.kind !== "image") throw new Fault(422,"VALIDATION_FAILED","Choose a JPEG or PNG start frame.",{startAssetId:"A start frame must be an image."});
  }
}
export async function imageReference(rt:Runtime,owner:string,id:string) {
  const sample=publicSample(id);
  if (sample) {
    if (sample.mimeType !== "image/jpeg" && sample.mimeType !== "image/png") throw new Fault(422,"INPUT_REQUIRED","Choose an image start frame.");
    return { id,sha256:SAMPLE_HASHES[id],mimeType:sample.mimeType };
  }
  const a=await ownedAsset(rt,owner,id);
  if (a.mime_type !== "image/jpeg" && a.mime_type !== "image/png") throw new Fault(422,"INPUT_REQUIRED","Choose an image start frame.");
  return {id,sha256:a.sha256,mimeType:a.mime_type};
}
