import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { harness, imageBytes } from './harness.mjs';
import { transfer, Mp4Inspector } from '../../src/server/transfer.ts';

// Isolated stand-in for Workers' FixedLengthStream. Does not establish its hosted behavior.
class TestFixedLengthStream {
  constructor(length) {let count=0;const stream=new TransformStream({transform(chunk,c){count+=chunk.length;if(count>length)throw new Error('too long');c.enqueue(chunk);},flush(){if(count!==length)throw new Error('too short');}});this.readable=stream.readable;this.writable=stream.writable;}
}
const job=()=>({id:crypto.randomUUID(),guest_id:crypto.randomUUID()});
const output={url:'https://fal.media/result.mp4',mimeType:'video/mp4',width:null,height:null,seed:null,durationSeconds:null};

test('Streamed MP4 transfer counts bytes, validates container, and reconciles exactly one retained object',async()=>{
  const old=globalThis.FixedLengthStream;globalThis.FixedLengthStream=TestFixedLengthStream;
  try {
    const bytes=new Uint8Array(readFileSync(new URL('../../public/samples/dune-flight.mp4',import.meta.url)));let calls=0;
    const h=harness({fetcher:async()=>{calls++;let offset=0;return new Response(new ReadableStream({pull(c){if(offset===bytes.length){c.close();return;}c.enqueue(bytes.slice(offset,offset+17003));offset=Math.min(bytes.length,offset+17003);}}),{headers:{'Content-Type':'video/mp4','Content-Length':String(bytes.length)}});}}),j=job();
    const result=await transfer(h.runtime,j,output);assert.equal(result.size,bytes.length);assert.equal(result.sha256,createHash('sha256').update(bytes).digest('hex'));assert.equal(h.r2.calls.put,1);
    assert.equal((await transfer(h.runtime,j,output)).sha256,result.sha256);assert.equal(calls,1);assert.equal(h.r2.calls.put,1);
  } finally {globalThis.FixedLengthStream=old;}
});

test('Transfer rejects oversized/unknown-size video and MIME mismatch without writing R2',async()=>{
  for(const headers of [{'Content-Type':'video/mp4','Content-Length':'20000001'},{'Content-Type':'video/mp4'},{'Content-Type':'text/html','Content-Length':'10'}]) {
    const h=harness({fetcher:async()=>new Response('not media',{headers})});await assert.rejects(()=>transfer(h.runtime,job(),output));assert.equal(h.r2.calls.put,0);
  }
  const inspector=new Mp4Inspector();assert.throws(()=>{inspector.push(new Uint8Array([0,0,0,24,102,116,121,112]));inspector.finish();},/Incomplete/);
});

test('Bounded image transfer rejects excess actual bytes even when content-length is omitted',async()=>{
  let count=0,cancelled=false;const h=harness({fetcher:async()=>new Response(new ReadableStream({pull(c){count++;c.enqueue(new Uint8Array(1000000));},cancel(){cancelled=true;}}),{headers:{'Content-Type':'image/jpeg'}})});
  await assert.rejects(()=>transfer(h.runtime,job(),{...output,mimeType:'image/jpeg',url:'https://fal.media/image.jpg'}));assert.ok(count<=7);assert.equal(cancelled,true);assert.equal(h.r2.calls.put,0);
});

test('Image transfer rejects malformed bytes before any R2 write',async()=>{
  const bytes=imageBytes().slice(0,-1);const h=harness({fetcher:async()=>new Response(bytes,{headers:{'Content-Type':'image/jpeg'}})});
  await assert.rejects(()=>transfer(h.runtime,job(),{...output,mimeType:'image/jpeg'}));assert.equal(h.r2.calls.put,0);
});
