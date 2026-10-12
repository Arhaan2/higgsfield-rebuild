import { Fault, privateHeaders } from "./http";
import type { AssetRow, Runtime } from "./store";
export function parseRange(value:string,size:number):{offset:number;length:number} {
  const m=/^bytes=(\d*)-(\d*)$/.exec(value);
  const fail=():never=>{throw new Fault(416,"RANGE_NOT_SATISFIABLE","This byte range is unavailable.");};
  if (!m || (!m[1]&&!m[2]) || size<=0) return fail();
  if ([m[1],m[2]].some(s=>s && !Number.isSafeInteger(Number(s)))) return fail();
  if (!m[1]) { const n=Number(m[2]); if(n<=0) return fail(); const length=Math.min(n,size);return {offset:size-length,length}; }
  const start=Number(m[1]),end=m[2]?Math.min(Number(m[2]),size-1):size-1;
  if (start>=size || end<start) return fail(); return {offset:start,length:end-start+1};
}
export async function media(rt:Runtime,request:Request,a:AssetRow,download:boolean) {
  const object=await rt.bucket.head(a.object_key);
  if (!object || object.size!==a.byte_size) throw new Fault(503,"SERVICE_UNAVAILABLE","The retained file is temporarily unavailable.");
  const filename=a.file_name.replace(/[^\x20-\x7e]|["\\]/g,"_");
  const headers=new Headers({...privateHeaders,"Content-Type":a.mime_type,"Accept-Ranges":"bytes",ETag:object.httpEtag,
    "Content-Disposition":`${download?"attachment":"inline"}; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(a.file_name).replace(/['()*]/g,c=>`%${c.charCodeAt(0).toString(16)}`)}`});
  let range:ReturnType<typeof parseRange>|undefined;
  const rangeHeader=request.headers.get("Range"), ifRange=request.headers.get("If-Range");
  if (rangeHeader && (!ifRange || ifRange===object.httpEtag)) {
    try { range=parseRange(rangeHeader,object.size); }
    catch (error) { if (!(error instanceof Fault)) throw error; headers.set("Content-Range",`bytes */${object.size}`); headers.set("Content-Type","application/json"); headers.delete("Content-Disposition"); return new Response(request.method==="HEAD"?null:JSON.stringify({error:{code:error.code,message:error.message,retryable:false},requestId:crypto.randomUUID()}),{status:416,headers}); }
  }
  if (!rangeHeader && request.headers.get("If-None-Match")?.split(",").map(s=>s.trim().replace(/^W\//,"")).some(s=>s===object.httpEtag||s==="*")) return new Response(null,{status:304,headers});
  headers.set("Content-Length",String(range?.length ?? object.size));
  if (range) headers.set("Content-Range",`bytes ${range.offset}-${range.offset+range.length-1}/${object.size}`);
  if (request.method==="HEAD") return new Response(null,{status:range?206:200,headers});
  const body=await rt.bucket.get(a.object_key,range?{range}:undefined);
  if (!body || !("body" in body)) throw new Fault(503,"SERVICE_UNAVAILABLE","The retained file is temporarily unavailable.");
  return new Response(body.body,{status:range?206:200,headers});
}
