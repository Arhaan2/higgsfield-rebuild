import { Buffer } from "node:buffer";
import { z } from "zod";
import { PRESETS, SAMPLE_ASSETS } from "../catalog/samples";
import { projectCreateSchema, projectPatchSchema, jobCreateSchema } from "../contracts/studio";
import { canonical, emptySchema, errorResponse, Fault, iso, json, ok, requireOrigin, sha256, uuid } from "./http";
import { all, assetDTO, cookieName, guest, jobDTO, one, ownedAsset, ownedJob, ownedProject, projectDTO, publicSample, rate, stmt, validateReferences, type AssetRow, type GuestRow, type JobRow, type ProjectRow, type Runtime } from "./store";
import { capabilities, createJob, progressJob } from "./jobs";
import { upload } from "./uploads";
import { media } from "./media";

export async function handle(request:Request,rt:Runtime):Promise<Response> {
  const requestId=crypto.randomUUID();
  try {const response=await dispatch(request,rt,requestId);if(request.method==="HEAD")return new Response(null,{status:response.status,headers:response.headers});return response;}
  catch(error) {const response=errorResponse(error,requestId);return request.method==="HEAD"?new Response(null,{status:response.status,headers:response.headers}):response;}
}
async function dispatch(request:Request,rt:Runtime,requestId:string):Promise<Response> {
  const path=new URL(request.url).pathname.replace(/\/$/,""),method=request.method,url=new URL(request.url);
  if(["POST","PUT","PATCH","DELETE"].includes(method))requireOrigin(request,rt.config);
  const publicHeaders={"Cache-Control":"public, max-age=60",Vary:""};
  if(path==="/api/capabilities"&&method==="GET")return ok(await capabilities(rt),requestId);
  if(path==="/api/presets"&&method==="GET")return ok(PRESETS,requestId,200,publicHeaders);
  if(path==="/api/samples"&&method==="GET")return ok({assets:SAMPLE_ASSETS,presets:PRESETS},requestId,200,publicHeaders);
  if(path==="/api/guest"&&method==="POST") {
    await json(request,emptySchema);const existing=await guest(rt,request,false);
    if(existing)return ok({expiresAt:iso(existing.expires_at)},requestId);
    await rate(rt,"session","global",10,60000);
    const token=Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url"),now=rt.now(),expires=now+2592000000;
    await stmt(rt,"INSERT INTO guests (id,token_hash,created_at,expires_at) VALUES (?,?,?,?)",crypto.randomUUID(),await sha256(token),now,expires).run();
    const secure=cookieName(rt.config).startsWith("__Host-")?"; Secure":"";
    return ok({expiresAt:iso(expires)},requestId,201,{"Set-Cookie":`${cookieName(rt.config)}=${token}; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=2592000`});
  }
  const assetMatch=/^\/api\/assets\/([^/]+)(?:\/(media|download))?$/.exec(path);
  if(assetMatch&&(method==="GET"||method==="HEAD")) {
    const sample=publicSample(assetMatch[1]);
    if(sample) {
      if(assetMatch[2])return new Response(null,{status:307,headers:{Location:assetMatch[2]==="download"?sample.downloadUrl:sample.mediaUrl,"Cache-Control":"public, max-age=3600"}});
      return ok(sample,requestId,200,publicHeaders);
    }
    const owner=(await guest(rt,request))!;await rate(rt,"reads",owner.id,120,60000);
    const a=await ownedAsset(rt,owner.id,uuid(assetMatch[1]));
    if(assetMatch[2])return media(rt,request,a,assetMatch[2]==="download");return ok(assetDTO(a),requestId);
  }
  const owner=(await guest(rt,request)) as GuestRow;
  if(method==="GET")await rate(rt,"reads",owner.id,120,60000);
  if(path==="/api/projects") {
    if(method==="GET") {
      const limitText=url.searchParams.get("limit")||"20";
      if(!/^\d+$/.test(limitText)||Number(limitText)<1||Number(limitText)>50)throw new Fault(422,"VALIDATION_FAILED","Choose a list size from 1 to 50.");
      const limit=Number(limitText);let cursor:{createdAt:number;id:string}|null=null;
      const raw=url.searchParams.get("cursor");
      if(raw) {try {if(raw.length>256)throw new Error();cursor=z.object({createdAt:z.number().int().nonnegative().safe(),id:z.string().uuid()}).strict().parse(JSON.parse(Buffer.from(raw,"base64url").toString("utf8")));}catch{throw new Fault(422,"VALIDATION_FAILED","This page cursor is invalid.");}}
      const rows=cursor?await all<ProjectRow>(rt,"SELECT * FROM projects WHERE guest_id=? AND (created_at<? OR (created_at=? AND id<?)) ORDER BY created_at DESC,id DESC LIMIT ?",owner.id,cursor.createdAt,cursor.createdAt,cursor.id,limit+1):await all<ProjectRow>(rt,"SELECT * FROM projects WHERE guest_id=? ORDER BY created_at DESC,id DESC LIMIT ?",owner.id,limit+1);
      const items=rows.slice(0,limit),last=items.at(-1);
      return ok({items:items.map(projectDTO),nextCursor:rows.length>limit&&last?Buffer.from(JSON.stringify({createdAt:last.created_at,id:last.id})).toString("base64url"):null},requestId);
    }
    if(method==="POST") {
      const input=await json(request,projectCreateSchema);await rate(rt,"writes",owner.id,60,3600000);await validateReferences(rt,owner.id,input.draft);
      const existing=await one<ProjectRow>(rt,"SELECT * FROM projects WHERE id=? AND guest_id=?",input.id,owner.id);
      const replay=(p:ProjectRow)=>{if(p.title!==input.title||canonical(JSON.parse(p.draft_json))!==canonical(input.draft))throw new Fault(409,"REVISION_CONFLICT","This project ID already contains a different draft.");return ok(projectDTO(p),requestId);};
      if(existing)return replay(existing);
      const now=rt.now();
      try {await stmt(rt,"INSERT INTO projects (id,guest_id,title,draft_json,revision,created_at,updated_at) VALUES (?,?,?,?,1,?,?)",input.id,owner.id,input.title,canonical(input.draft),now,now).run();}
      catch(error){const raced=await one<ProjectRow>(rt,"SELECT * FROM projects WHERE id=? AND guest_id=?",input.id,owner.id);if(raced)return replay(raced);if(String(error).includes("UNIQUE"))throw new Fault(409,"REVISION_CONFLICT","This project ID is unavailable. Create a new draft.");throw error;}
      return ok(projectDTO(await ownedProject(rt,owner.id,input.id)),requestId,201);
    }
  }
  const projectMatch=/^\/api\/projects\/([^/]+)(?:\/(uploads|jobs))?$/.exec(path);
  if(projectMatch) {
    const id=uuid(projectMatch[1]);
    if(projectMatch[2]==="jobs"&&method==="POST") {
      const input=await json(request,jobCreateSchema);if(!Number.isSafeInteger(input.draftRevision))throw new Fault(422,"VALIDATION_FAILED","Invalid draft revision.");
      await rate(rt,"writes",owner.id,60,3600000);
      const result=await createJob(rt,owner.id,id,input.requestKey,input.draftRevision);return ok(jobDTO(result.job,rt.now()),requestId,result.created?202:200);
    }
    const p=await ownedProject(rt,owner.id,id);
    if(projectMatch[2]==="uploads"&&method==="POST") {
      await rate(rt,"writes",owner.id,60,3600000);await rate(rt,"uploads",owner.id,10,3600000);
      const result=await upload(rt,request,owner.id,id);return ok(assetDTO(result.asset),requestId,result.created?201:200);
    }
    if(!projectMatch[2]&&method==="GET") {
      const [assets,jobs]=await Promise.all([all<AssetRow>(rt,"SELECT * FROM assets WHERE project_id=? AND guest_id=? ORDER BY created_at,id LIMIT 12",id,owner.id),all<JobRow>(rt,"SELECT * FROM jobs WHERE project_id=? AND guest_id=? ORDER BY created_at,id LIMIT 100",id,owner.id)]);
      return ok({project:projectDTO(p),assets:assets.map(assetDTO),jobs:jobs.map(j=>jobDTO(j,rt.now()))},requestId);
    }
    if(!projectMatch[2]&&method==="PATCH") {
      const input=await json(request,projectPatchSchema);if(!Number.isSafeInteger(input.expectedRevision))throw new Fault(422,"VALIDATION_FAILED","Invalid draft revision.");
      await rate(rt,"writes",owner.id,60,3600000);
      if(input.draft)await validateReferences(rt,owner.id,input.draft);
      if(input.preferredAssetId && !publicSample(input.preferredAssetId)) {const a=await ownedAsset(rt,owner.id,input.preferredAssetId);if(a.project_id!==id)throw new Fault(422,"VALIDATION_FAILED","Choose a preferred version from this project.",{preferredAssetId:"Choose a version from this project."});}
      const updated=await stmt(rt,`UPDATE projects SET title=?,draft_json=?,preferred_asset_id=?,revision=revision+1,updated_at=? WHERE id=? AND guest_id=? AND revision=? RETURNING *`,input.title??p.title,input.draft?canonical(input.draft):p.draft_json,input.preferredAssetId===undefined?p.preferred_asset_id:input.preferredAssetId,rt.now(),id,owner.id,input.expectedRevision).first<ProjectRow>();
      if(!updated)throw new Fault(409,"REVISION_CONFLICT","This draft changed in another tab. Reload its saved version before saving again.");
      return ok(projectDTO(updated),requestId);
    }
  }
  const jobMatch=/^\/api\/jobs\/([^/]+)(?:\/(refresh|retry-transfer))?$/.exec(path);
  if(jobMatch) {
    const id=uuid(jobMatch[1]);
    if(!jobMatch[2]&&method==="GET")return ok(jobDTO(await ownedJob(rt,owner.id,id),rt.now()),requestId);
    if(jobMatch[2]&&method==="POST") {await json(request,emptySchema);await rate(rt,"refresh",owner.id,20,60000);const result=await progressJob(rt,owner.id,id,jobMatch[2]==="retry-transfer");return ok(jobDTO(result,rt.now()),requestId);}
  }
  throw new Fault(404,"NOT_FOUND","This endpoint is unavailable.");
}
