import { Buffer } from "node:buffer";
import { PRESETS } from "../catalog/samples";
import { IMAGE_MODEL, VIDEO_MODEL, IMAGE_SETTINGS, VIDEO_SETTINGS, UPLOAD_LIMIT, type Capabilities, type Snapshot } from "../contracts/studio";
import { boundedBytes, canonical, Fault, keyFor, sha256 } from "./http";
import { one, stmt, imageReference, ownedJob, ownedProject, projectDTO, publicSample, validateReferences, type JobRow, type Runtime } from "./store";
import * as fal from "./fal";
import { transfer } from "./transfer";
export async function policy(rt:Runtime) {
  const row=await one<{cap:number;used:number}>(rt,`SELECT COALESCE((SELECT cap_micro_usd FROM budget_policy WHERE id=1),0) AS cap,
    COALESCE((SELECT sum(reserve_micro_usd) FROM jobs WHERE accounting_state != 'released'),0) AS used`);
  const cap=Math.min(rt.config.budgetMicroUsd,row?.cap||0),used=row?.used||0;
  const reason:Capabilities["liveGeneration"]["reason"]=!rt.config.liveEnabled?"disabled":cap<=0?"budget_zero":!rt.config.falKey||!rt.config.origin?"unavailable":used>=cap?"budget_exhausted":null;
  return {cap,used,reason};
}
export async function capabilities(rt:Runtime):Promise<Capabilities> {
  let cap=0,remaining=0,reason:Capabilities["liveGeneration"]["reason"]="unavailable";
  try {const p=await policy(rt);cap=p.cap;remaining=Math.max(0,cap-p.used);reason=p.reason;} catch {if(!rt.config.liveEnabled)reason="disabled";else if(rt.config.budgetMicroUsd===0)reason="budget_zero";}
  return {liveGeneration:{enabled:reason===null,reason,budgetLimitMicroUsd:cap,remainingMicroUsd:remaining},operations:[
    {id:"text_to_image",modelId:IMAGE_MODEL,imageSize:{width:1280,height:720},count:1},
    {id:"image_to_video",modelId:VIDEO_MODEL,durationSeconds:5,referenceRole:"start_frame"}],upload:{mimeTypes:["image/jpeg","image/png"],maxBytes:UPLOAD_LIMIT},samplesAvailable:true};
}
function assertAdmission(rt:Runtime,p:Awaited<ReturnType<typeof policy>>,cost:number) {
  if(!rt.config.liveEnabled)throw new Fault(403,"LIVE_DISABLED","Live generation is disabled. You can save drafts, upload images, and explore prepared samples.");
  if(p.cap<=0)throw new Fault(403,"BUDGET_ZERO","Live generation has no approved spending allowance. Your draft is saved.");
  if(!rt.config.falKey || !rt.config.origin)throw new Fault(503,"SERVICE_UNAVAILABLE","Live generation is unavailable. Your draft is saved.");
  if(p.used+cost>p.cap)throw new Fault(429,"BUDGET_EXHAUSTED","The generation allowance has been reached. Your draft is saved.");
}
function matching(job:JobRow,project:string,revision:number) {
  if(job.project_id!==project||job.requested_revision!==revision)throw new Fault(409,"REQUEST_KEY_CONFLICT","This request key belongs to an earlier draft. Review it before starting another generation.");
  return job;
}
export async function createJob(rt:Runtime,owner:string,project:string,requestKey:string,revision:number) {
  const existing=await one<JobRow>(rt,"SELECT * FROM jobs WHERE guest_id=? AND request_key=?",owner,requestKey);
  if(existing)return {job:matching(existing,project,revision),created:false};
  // Replay happens before current policy or revision checks. Zero cap has no job/storage/provider side effect.
  const saved=await ownedProject(rt,owner,project);
  const p=await policy(rt);assertAdmission(rt,p,0);
  if(saved.revision!==revision)throw new Fault(409,"REVISION_CONFLICT","Save or reload the current draft before generating.");
  const draft=projectDTO(saved).draft;
  await validateReferences(rt,owner,draft);
  if(!draft.prompt.trim())throw new Fault(422,"INPUT_REQUIRED","Write a prompt before generating.",{prompt:"Add a prompt."});
  const preset=PRESETS.find(p=>p.id===draft.presetId);
  const base={schemaVersion:1 as const,provider:"fal" as const,prompt:draft.prompt,presetId:draft.presetId,presetVersion:preset?.version??null,parentAssetId:draft.parentAssetId};
  let snapshot:Snapshot;
  if(draft.operation==="text_to_image")snapshot={...base,operation:draft.operation,modelId:IMAGE_MODEL,startAsset:null,settings:IMAGE_SETTINGS};
  else {if(!draft.startAssetId)throw new Fault(422,"INPUT_REQUIRED","Choose an image start frame.",{startAssetId:"Choose an image."});snapshot={...base,operation:draft.operation,modelId:VIDEO_MODEL,startAsset:await imageReference(rt,owner,draft.startAssetId),settings:VIDEO_SETTINGS};}
  const cost=snapshot.operation==="text_to_image"?10000:400000;assertAdmission(rt,p,cost);
  const id=crypto.randomUUID(),now=rt.now(),snapshotJson=canonical(snapshot),hash=await sha256(snapshotJson);
  try {
    const inserted=await stmt(rt,`INSERT INTO jobs (id,guest_id,project_id,request_key,requested_revision,submit_hash,snapshot_json,status,reserve_micro_usd,accounting_state,created_at,updated_at)
      SELECT ?,?,?,?,?,?,?,'prepared',?,'held',?,? WHERE ? > 0 AND ? + COALESCE((SELECT sum(reserve_micro_usd) FROM jobs WHERE accounting_state != 'released'),0)
      <= MIN(?,COALESCE((SELECT cap_micro_usd FROM budget_policy WHERE id=1),0)) RETURNING *`,id,owner,project,requestKey,revision,hash,snapshotJson,cost,now,now,rt.config.budgetMicroUsd,cost,rt.config.budgetMicroUsd).first<JobRow>();
    if(!inserted)throw new Fault(429,"BUDGET_EXHAUSTED","The generation allowance has been reached.");
  } catch(error) {
    const raced=await one<JobRow>(rt,"SELECT * FROM jobs WHERE guest_id=? AND request_key=?",owner,requestKey);
    if(raced)return {job:matching(raced,project,revision),created:false};throw error;
  }
  return {job:await progressJob(rt,owner,id,false),created:true};
}
async function inputData(rt:Runtime,job:JobRow,snapshot:Snapshot) {
  if(snapshot.operation!=="image_to_video")return undefined;
  const ref=snapshot.startAsset,sample=publicSample(ref.id);let bytes:Uint8Array<ArrayBuffer>;
  if(sample) {
    if(!rt.config.origin || !sample.mediaUrl.startsWith("/samples/") || sample.mediaUrl.startsWith("//"))throw new Error("Invalid sample source");
    const response=await rt.fetcher(new URL(sample.mediaUrl,rt.config.origin),{redirect:"error",signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw new Error("Sample unavailable");bytes=await boundedBytes(response.body,UPLOAD_LIMIT,response.headers.get("Content-Length"));
  } else {
    // Cross-project reuse keeps the asset in its source project, but always the same owner.
    const owned=await imageReference(rt,job.guest_id,ref.id);if(owned.sha256!==ref.sha256)throw new Error("Input changed");
    const object=await rt.bucket.get(keyFor(job.guest_id,ref.id));if(!object || !("body" in object))throw new Error("Input unavailable");
    bytes=await boundedBytes(object.body,UPLOAD_LIMIT,String(object.size));
  }
  if(await sha256(bytes)!==ref.sha256)throw new Error("Input hash mismatch");
  return `data:${ref.mimeType};base64,${Buffer.from(bytes).toString("base64")}`;
}
async function failPrepared(rt:Runtime,job:JobRow) {
  await rt.db.batch([
    stmt(rt,"UPDATE jobs SET status='failed',accounting_state='released',error_code='NOT_SUBMITTED',error_message=?,updated_at=? WHERE id=? AND status='prepared'","Generation did not start. Your draft is retained.",rt.now(),job.id),
    stmt(rt,"UPDATE storage_reservations SET state='released',updated_at=? WHERE job_id=? AND state='held' AND EXISTS (SELECT 1 FROM jobs WHERE id=? AND status='failed' AND accounting_state='released')",rt.now(),job.id,job.id),
  ]);
}
async function prepareSubmit(rt:Runtime,job:JobRow) {
  const snapshot=JSON.parse(job.snapshot_json) as Snapshot;
  const p=await policy(rt);
  if(!rt.config.liveEnabled||p.cap<=0||p.used>p.cap||!rt.config.falKey||!rt.config.origin) {await failPrepared(rt,job);return;}
  let input:string|undefined;
  try {input=await inputData(rt,job,snapshot);} catch {await failPrepared(rt,job);return;}
  const now=rt.now(),lease=crypto.randomUUID();
  // The final atomic check includes current DB cap and all outstanding reservations.
  const acquired=await stmt(rt,`UPDATE jobs SET status='submitting',lease_token=?,lease_expires_at=?,updated_at=? WHERE id=? AND status='prepared'
    AND COALESCE((SELECT sum(reserve_micro_usd) FROM jobs WHERE accounting_state!='released'),0) <= MIN(?,COALESCE((SELECT cap_micro_usd FROM budget_policy WHERE id=1),0))
    AND COALESCE((SELECT cap_micro_usd FROM budget_policy WHERE id=1),0)>0`,lease,now+60000,now,job.id,rt.config.budgetMicroUsd).run();
  if(!acquired.meta.changes)return;
  try {
    const sent=await fal.submit(rt,snapshot,input);
    await stmt(rt,`UPDATE jobs SET provider_request_id=?,provider_status_url=?,provider_result_url=?,status=?,lease_token=NULL,lease_expires_at=NULL,next_poll_at=?,updated_at=?
      WHERE id=? AND lease_token=? AND status='submitting' AND lease_expires_at>?`,sent.id,sent.statusUrl,sent.resultUrl,sent.status,rt.now()+3000,rt.now(),job.id,lease,rt.now()).run();
  } catch {
    // Includes DB failure after the POST: never return to prepared or release held spend.
    await stmt(rt,`UPDATE jobs SET status='submission_unknown',error_code='SUBMISSION_UNKNOWN',error_message=?,lease_token=NULL,lease_expires_at=NULL,next_poll_at=NULL,updated_at=?
      WHERE id=? AND lease_token=? AND status='submitting'`,"The provider may have accepted this request. The owner must review it before another generation can start.",rt.now(),job.id,lease).run();
  }
}
async function leasedUpdate(rt:Runtime,job:JobRow,lease:string,sql:string,args:unknown[]) {
  return stmt(rt,`UPDATE jobs SET ${sql},updated_at=? WHERE id=? AND lease_token=? AND lease_expires_at>?`,...args,rt.now(),job.id,lease,rt.now()).run();
}
export async function progressJob(rt:Runtime,owner:string,id:string,retryTransfer:boolean) {
  let job=await ownedJob(rt,owner,id);
  if(retryTransfer && job.status!=="transfer_failed")throw new Fault(409,"INVALID_STATE","This job does not need a transfer retry.");
  if(job.status==="prepared") {await prepareSubmit(rt,job);return ownedJob(rt,owner,id);}
  if(job.status==="submitting") {
    await stmt(rt,`UPDATE jobs SET status='submission_unknown',error_code='SUBMISSION_UNKNOWN',error_message=?,lease_token=NULL,lease_expires_at=NULL,next_poll_at=NULL,updated_at=?
      WHERE id=? AND status='submitting' AND lease_expires_at<=?`,"Submission confirmation was lost. The owner must review this request before another generation can start.",rt.now(),id,rt.now()).run();
    return ownedJob(rt,owner,id);
  }
  if(["succeeded","failed"].includes(job.status) || (job.status==="submission_unknown"&&!job.provider_request_id) || (job.status==="transfer_failed"&&!retryTransfer))return job;
  if(!job.provider_request_id)return job;
  // No outbound provider traffic while live access is disabled or either cap is zero.
  const p=await policy(rt);if(!rt.config.liveEnabled||p.cap<=0||!rt.config.falKey)return job;
  if(job.next_poll_at && job.next_poll_at>rt.now())return job;
  const lease=crypto.randomUUID(),now=rt.now();
  const claim=await stmt(rt,`UPDATE jobs SET lease_token=?,lease_expires_at=?,last_checked_at=?,next_poll_at=? WHERE id=? AND guest_id=?
    AND status IN ('submission_unknown','queued','running','storing','transfer_failed') AND (lease_expires_at IS NULL OR lease_expires_at<=?) AND (next_poll_at IS NULL OR next_poll_at<=?)`,lease,now+60000,now,now+5000,id,owner,now,now).run();
  if(!claim.meta.changes)return ownedJob(rt,owner,id);
  job=await ownedJob(rt,owner,id);const snapshot=JSON.parse(job.snapshot_json) as Snapshot;
  let output:fal.ProviderOutput|null=job.provider_output_json?JSON.parse(job.provider_output_json):null;
  let providerComplete=Boolean(output) || job.status==="transfer_failed";
  try {
    if(!output) {
      const state=await fal.status(rt,snapshot.modelId,job.provider_request_id!,job.provider_status_url!);
      if(state.status!=="COMPLETED") {
        await leasedUpdate(rt,job,lease,"status=?,error_code=NULL,error_message=NULL,lease_token=NULL,lease_expires_at=NULL",[state.status==="IN_QUEUE"?"queued":"running"]);
        return ownedJob(rt,owner,id);
      }
      if(state.error!==undefined && state.error!==null) {
        await leasedUpdate(rt,job,lease,"status='failed',accounting_state='committed',error_code='PROVIDER_FAILED',error_message=?,next_poll_at=NULL,lease_token=NULL,lease_expires_at=NULL",["The provider could not complete this request. Your draft is retained; the reserved allowance remains counted until billing review."]);
        return ownedJob(rt,owner,id);
      }
      providerComplete=true;
      output=await fal.result(rt,snapshot,job.provider_request_id!,job.provider_result_url!);
      const saved=await leasedUpdate(rt,job,lease,"status='storing',accounting_state='committed',provider_output_json=?,error_code=NULL,error_message=NULL,lease_expires_at=?",[JSON.stringify(output),rt.now()+60000]);
      if(!saved.meta.changes)return ownedJob(rt,owner,id);
    } else {
      const held=await leasedUpdate(rt,job,lease,"status='storing',lease_expires_at=?",[rt.now()+60000]);if(!held.meta.changes)return ownedJob(rt,owner,id);
    }
    // The full lease is renewed immediately before the bounded transfer.
    const copied=await transfer(rt,job,output),metadata={seed:output.seed,width:copied.width,height:copied.height,durationSeconds:output.durationSeconds};
    const isImage=output.mimeType==="image/jpeg",filename=`frame-${id}.${isImage?"jpg":"mp4"}`;
    await rt.db.batch([
      stmt(rt,`INSERT INTO assets (id,guest_id,project_id,source,kind,object_key,file_name,mime_type,byte_size,width,height,duration_ms,sha256,source_job_id,created_at)
        SELECT ?,?,?,'generation',?,?,?,?,?,?,?,?,?,?,? FROM jobs WHERE id=? AND lease_token=? AND lease_expires_at>? AND status='storing'
        AND NOT EXISTS (SELECT 1 FROM assets WHERE source_job_id=?)`,id,owner,job.project_id,isImage?"image":"video",keyFor(owner,id),filename,output.mimeType,copied.size,copied.width,copied.height,output.durationSeconds===null?null:Math.round(output.durationSeconds*1000),copied.sha256,id,rt.now(),id,lease,rt.now(),id),
      stmt(rt,`UPDATE jobs SET status='succeeded',output_asset_id=?,actual_metadata_json=?,accounting_state='committed',error_code=NULL,error_message=NULL,lease_token=NULL,lease_expires_at=NULL,next_poll_at=NULL,updated_at=?
        WHERE id=? AND lease_token=? AND lease_expires_at>? AND EXISTS (SELECT 1 FROM assets WHERE source_job_id=?)`,id,JSON.stringify(metadata),rt.now(),id,lease,rt.now(),id),
    ]);
  } catch {
    if(providerComplete) await leasedUpdate(rt,job,lease,"status='transfer_failed',error_code='TRANSFER_FAILED',error_message=?,next_poll_at=NULL,lease_token=NULL,lease_expires_at=NULL",["The result could not be retained. Retry the transfer of this same result; no new generation will be submitted."]);
    else await leasedUpdate(rt,job,lease,"error_code='REFRESH_UNAVAILABLE',error_message=?,next_poll_at=?,lease_token=NULL,lease_expires_at=NULL",["Status is temporarily unavailable. Refresh this same request shortly.",rt.now()+15000]);
  }
  return ownedJob(rt,owner,id);
}
