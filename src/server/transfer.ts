import { createHash } from "node:crypto";
import { boundedBytes, keyFor } from "./http";
import { validateImage } from "./images";
import { outputUrl, type ProviderOutput } from "./fal";
import type { Runtime, JobRow } from "./store";

// Structural MP4 validation with constant parser memory. This is not a codec decoder.
export class Mp4Inspector {
  private header:number[]=[]; private remaining=0; private type=""; private boxes=new Set<string>(); private total=0; private first=true; private brand:number[]=[];
  push(bytes:Uint8Array) {
    let at=0; this.total+=bytes.length;
    while(at<bytes.length) {
      if(this.remaining>0) {
        const n=Math.min(this.remaining,bytes.length-at);
        if(this.type==="ftyp" && this.brand.length<4) {
          const take=Math.min(n,4-this.brand.length);this.brand.push(...bytes.subarray(at,at+take));
          if(this.brand.length===4 && !["isom","iso2","iso3","iso4","iso5","iso6","iso8","iso9","avc1","mp41","mp42","dash","M4V "].includes(String.fromCharCode(...this.brand))) throw new Error("Unsupported MP4 brand");
        }
        this.remaining-=n; at+=n; continue;
      }
      const need=this.header.length<8?8:16;
      while(this.header.length<need && at<bytes.length) this.header.push(bytes[at++]);
      if(this.header.length<8) continue;
      const v=new DataView(Uint8Array.from(this.header).buffer), short=v.getUint32(0);
      if(short===1 && this.header.length<16) continue;
      const length=short===1?Number(v.getBigUint64(8)):short;
      const headSize=short===1?16:8;
      if(!Number.isSafeInteger(length) || length<headSize || length>20000000) throw new Error("Invalid MP4 box length");
      this.type=String.fromCharCode(...this.header.slice(4,8));
      if((this.first && (this.type!=="ftyp" || length<16)) || (this.type==="ftyp" && this.boxes.has("ftyp"))) throw new Error("Missing MP4 signature");
      this.first=false; this.boxes.add(this.type); this.remaining=length-headSize; this.header=[];
    }
  }
  finish() { if(this.remaining || this.header.length || !["ftyp","moov","mdat"].every(x=>this.boxes.has(x)) || this.total<32) throw new Error("Incomplete MP4 container"); }
}
async function inspectStream(body:ReadableStream<Uint8Array>,max:number,mime:string) {
  if(mime==="image/jpeg") { const bytes=await boundedBytes(body,max); const info=validateImage(bytes,mime); return {sha256:createHash("sha256").update(bytes).digest("hex"),size:bytes.length,width:info.width,height:info.height}; }
  const reader=body.getReader(),hash=createHash("sha256"),mp4=new Mp4Inspector();let size=0;
  try { for(;;) {const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max)throw new Error("Output too large");hash.update(value);mp4.push(value);} mp4.finish(); }
  catch(error) {await reader.cancel();throw error;} finally {reader.releaseLock();}
  return {sha256:hash.digest("hex"),size,width:null,height:null};
}
export async function transfer(rt:Runtime,job:JobRow,output:ProviderOutput, reconcileOnly=false) {
  const key=keyFor(job.guest_id,job.id),limit=output.mimeType==="image/jpeg"?5000000:20000000;
  const existing=await rt.bucket.get(key);
  if(existing) {
    if(!("body" in existing) || existing.customMetadata?.jobId!==job.id || existing.httpMetadata?.contentType!==output.mimeType) throw new Error("Retained output identity mismatch");
    const inspected=await inspectStream(existing.body,limit,output.mimeType);
    return {...inspected,width:inspected.width??output.width,height:inspected.height??output.height};
  }
  if(reconcileOnly)throw new Error("Conditional transfer did not retain an object");
  const response=await rt.fetcher(outputUrl(output.url),{redirect:"error",signal:AbortSignal.timeout(40000)});
  if(!response.ok || response.headers.get("Content-Type")?.split(";")[0].trim()!==output.mimeType || !response.body) { await response.body?.cancel(); throw new Error("Output unavailable or has unexpected type"); }
  const lengthText=response.headers.get("Content-Length");
  if(lengthText!==null && (!/^\d+$/.test(lengthText)||Number(lengthText)>limit||Number(lengthText)<=0)) {await response.body.cancel();throw new Error("Output too large");}
  if(output.mimeType==="image/jpeg") {
    const bytes=await boundedBytes(response.body,limit,lengthText),info=validateImage(bytes,output.mimeType),hash=createHash("sha256").update(bytes).digest("hex");
    const put=await rt.bucket.put(key,bytes,{onlyIf:{etagDoesNotMatch:"*"},httpMetadata:{contentType:output.mimeType},customMetadata:{jobId:job.id,sha256:hash}});
    if(!put) return transfer(rt,job,output,true);
    return {sha256:hash,size:bytes.length,width:info.width,height:info.height};
  }
  // R2 requires a stream with known length. Reject unknown length safely; never buffer video.
  if(!lengthText) {await response.body.cancel();throw new Error("Video response did not declare its size");}
  const length=Number(lengthText),hash=createHash("sha256"),mp4=new Mp4Inspector();let count=0;
  const checked=response.body.pipeThrough(new TransformStream<Uint8Array,Uint8Array>({
    transform(chunk,controller) {count+=chunk.length;if(count>limit||count>length)throw new Error("Output too large");hash.update(chunk);mp4.push(chunk);controller.enqueue(chunk);},
    flush(){if(count!==length)throw new Error("Truncated video");mp4.finish();},
  }));
  const fixed=new FixedLengthStream(length);
  // Await both, including cancellation when conditional first-write loses a race.
  const abort=new AbortController();
  const piping=checked.pipeTo(fixed.writable,{signal:abort.signal});
  const writing=rt.bucket.put(key,fixed.readable,{onlyIf:{etagDoesNotMatch:"*"},httpMetadata:{contentType:output.mimeType},customMetadata:{jobId:job.id}})
    .then(value=>{if(!value)abort.abort();return value;},error=>{abort.abort();throw error;});
  const [copied,stored]=await Promise.allSettled([piping,writing]);
  if(stored.status==="rejected") throw stored.reason;
  if(!stored.value) return transfer(rt,job,output,true);
  if(copied.status==="rejected") throw copied.reason;
  return {sha256:hash.digest("hex"),size:count,width:output.width,height:output.height};
}
