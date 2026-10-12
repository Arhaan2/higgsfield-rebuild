import { z } from "zod";
import type { Snapshot } from "../contracts/studio";
import { boundedBytes, Fault } from "./http";
import type { Runtime } from "./store";
const requestId = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
const submitSchema = z.object({request_id:requestId}).passthrough();
const statusSchema = z.object({status:z.enum(["IN_QUEUE","IN_PROGRESS","COMPLETED"]),request_id:requestId.optional(),error:z.unknown().optional()});
const mediaSchema = z.object({url:z.string().max(4096),content_type:z.string().optional(),width:z.number().int().positive().max(16384).optional(),height:z.number().int().positive().max(16384).optional()});
export type ProviderOutput = { url:string; mimeType:"image/jpeg"|"video/mp4"; seed:number|null; width:number|null; height:number|null; durationSeconds:number|null };
export function queueUrl(value:string,model:string,id:string,kind:"status"|"result") {
  const url=new URL(value); const family=model.split("/").slice(0,2).join("/");
  const allowedBases=[`/${model}/requests/${id}`,`/${family}/requests/${id}`];
  const paths=allowedBases.flatMap(base=>kind==="status"?[`${base}/status`]:[base,`${base}/response`]);
  if (url.protocol!=="https:" || url.hostname!=="queue.fal.run" || url.port || url.username || url.password || url.hash || url.search || !paths.includes(url.pathname)) throw new Error("Invalid queue URL");
  return url.href;
}
export function outputUrl(value:string) {
  const url=new URL(value);
  if (url.protocol!=="https:" || url.port || url.username || url.password || url.hash || !(
    url.hostname==="fal.media" || url.hostname.endsWith(".fal.media") || (url.hostname==="storage.googleapis.com" && url.pathname.startsWith("/falserverless/")))) throw new Error("Unapproved output location");
  return url.href;
}
async function queueJson(rt:Runtime,url:string,init:RequestInit,timeout=15000) {
  if (!rt.config.liveEnabled || rt.config.budgetMicroUsd <= 0 || !rt.config.falKey) throw new Fault(503,"SERVICE_UNAVAILABLE","Generation is unavailable.");
  const response=await rt.fetcher(url,{...init,redirect:"error",signal:AbortSignal.timeout(timeout),headers:{Authorization:`Key ${rt.config.falKey}`,"Content-Type":"application/json",...init.headers}});
  if (!response.ok) { await response.body?.cancel(); throw new Error("Provider request did not return success"); }
  const bytes=await boundedBytes(response.body,65536,response.headers.get("Content-Length"));
  return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes)) as unknown;
}
export async function submit(rt:Runtime,snapshot:Snapshot,imageDataUri?:string) {
  const input=snapshot.operation==="text_to_image" ? {prompt:snapshot.prompt,...snapshot.settings} : {prompt:snapshot.prompt,...snapshot.settings,image_url:imageDataUri};
  if (snapshot.operation==="image_to_video" && !imageDataUri) throw new Error("Missing start image");
  // Exactly one POST. A thrown error does not imply rejection or authorize a retry.
  const result=submitSchema.parse(await queueJson(rt,`https://queue.fal.run/${snapshot.modelId}`,{method:"POST",body:JSON.stringify(input),headers:{"X-Fal-No-Retry":"1","x-app-fal-disable-fallback":"true","X-Fal-Request-Start-Timeout":"120"}},20000));
  const id=result.request_id;
  // Keep a valid request ID even if convenience URLs are malformed. Known ID can be polled via canonical documented routes.
  let statusUrl=`https://queue.fal.run/${snapshot.modelId}/requests/${id}/status`;
  let resultUrl=`https://queue.fal.run/${snapshot.modelId}/requests/${id}`;
  try { if(typeof result.status_url === "string") statusUrl=queueUrl(result.status_url,snapshot.modelId,id,"status"); } catch { /* Canonical URL only. */ }
  try { if(typeof result.response_url === "string") resultUrl=queueUrl(result.response_url,snapshot.modelId,id,"result"); } catch { /* Canonical URL only. */ }
  return {id,statusUrl,resultUrl,status:result.status==="IN_PROGRESS"?"running" as const:"queued" as const};
}
export async function status(rt:Runtime,model:string,id:string,url:string) {
  const result=statusSchema.parse(await queueJson(rt,queueUrl(url,model,id,"status"),{method:"GET"}));
  if(result.request_id && result.request_id!==id) throw new Error("Mismatched provider identity");
  return result;
}
export async function result(rt:Runtime,snapshot:Snapshot,id:string,url:string):Promise<ProviderOutput> {
  const data=await queueJson(rt,queueUrl(url,snapshot.modelId,id,"result"),{method:"GET"});
  if(snapshot.operation==="text_to_image") {
    const parsed=z.object({images:z.array(mediaSchema).length(1),seed:z.number().int().safe().optional()}).parse(data);
    const image=parsed.images[0]; if(image.content_type && image.content_type!=="image/jpeg") throw new Error("Unexpected image type");
    return {url:image.url,mimeType:"image/jpeg",seed:parsed.seed??null,width:image.width??null,height:image.height??null,durationSeconds:null};
  }
  const parsed=z.object({video:mediaSchema}).parse(data);
  if(parsed.video.content_type && parsed.video.content_type!=="video/mp4") throw new Error("Unexpected video type");
  return {url:parsed.video.url,mimeType:"video/mp4",seed:null,width:parsed.video.width??null,height:parsed.video.height??null,durationSeconds:null};
}
