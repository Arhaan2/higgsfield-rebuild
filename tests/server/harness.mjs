import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { getTableName } from 'drizzle-orm';
import { getTableConfig, SQLiteSyncDialect } from 'drizzle-orm/sqlite-core';
import * as schema from '../../db/schema.ts';
import { readServerConfig } from '../../src/config/server.ts';
import { handle } from '../../src/server/api.ts';
const quote=s=>'"'+s.replaceAll('"','""')+'"';
export function database() {
  const db=new DatabaseSync(':memory:'); db.exec('PRAGMA foreign_keys=ON');
  const dialect=new SQLiteSyncDialect();
  // Build isolated SQLite tables directly from Drizzle declarations, without generating/applying a project migration.
  for(const table of Object.values(schema)) {
    const c=getTableConfig(table); const columns=c.columns.map(col=>`${quote(col.name)} ${col.getSQLType()}${col.primary?' PRIMARY KEY':''}${col.notNull?' NOT NULL':''}${col.isUnique?' UNIQUE':''}${col.default!==undefined?` DEFAULT ${typeof col.default==='number'?col.default:JSON.stringify(col.default)}`:''}`);
    for(const pk of c.primaryKeys)columns.push(`PRIMARY KEY (${pk.columns.map(c=>quote(c.name)).join(',')})`);
    for(const fk of c.foreignKeys) {const r=fk.reference();columns.push(`FOREIGN KEY (${r.columns.map(c=>quote(c.name)).join(',')}) REFERENCES ${quote(getTableName(r.foreignTable))} (${r.foreignColumns.map(c=>quote(c.name)).join(',')})`);}
    for(const check of c.checks)columns.push(`CHECK (${dialect.sqlToQuery(check.value).sql})`);
    db.exec(`CREATE TABLE ${quote(c.name)} (${columns.join(',')})`);
  }
  for(const table of Object.values(schema)) {const c=getTableConfig(table);for(const idx of c.indexes)db.exec(`CREATE ${idx.config.unique?'UNIQUE ':''}INDEX ${quote(idx.config.name)} ON ${quote(c.name)} (${idx.config.columns.map(c=>quote(c.name)).join(',')})`);}
  db.exec(readFileSync(new URL('../../src/server/schema-guards.sql',import.meta.url),'utf8'));
  const prepare=(sql,params=[])=>({
    bind(...values){return prepare(sql,values);},
    async first(column){const row=db.prepare(sql).get(...params)??null;return column&&row?row[column]:row;},
    async all(){return {success:true,results:db.prepare(sql).all(...params),meta:{changes:Number(db.prepare('SELECT changes() AS n').get().n)}};},
    async run(){const info=db.prepare(sql).run(...params);return {success:true,results:[],meta:{changes:Number(info.changes)}};},
    _all(){const results=db.prepare(sql).all(...params);return {success:true,results,meta:{changes:Number(db.prepare('SELECT changes() AS n').get().n)}};},
  });
  return {raw:db,prepare,async batch(statements){db.exec('BEGIN');try{const result=statements.map(s=>s._all());db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}}};
}
export function bucket() {
  const objects=new Map();const calls={get:0,head:0,put:0};let failAfterPut=false;
  const metadata=(key)=>{const value=objects.get(key);return value?{key,size:value.bytes.length,etag:'retained',httpEtag:'"retained"',httpMetadata:value.httpMetadata,customMetadata:value.customMetadata}:null;};
  return {objects,calls,failNextAfterWrite(){failAfterPut=true;},async head(key){calls.head++;return metadata(key);},async get(key,options){calls.get++;const meta=metadata(key);if(!meta)return null;let data=objects.get(key).bytes;if(options?.range)data=data.slice(options.range.offset,options.range.offset+options.range.length);return {...meta,body:new Response(data).body};},async put(key,value,options){calls.put++;if(objects.has(key)&&options?.onlyIf?.etagDoesNotMatch==='*')return null;const bytes=value instanceof Uint8Array?value:new Uint8Array(await new Response(value).arrayBuffer());objects.set(key,{bytes,httpMetadata:options?.httpMetadata,customMetadata:options?.customMetadata});if(failAfterPut){failAfterPut=false;throw new Error('Simulated lost R2 acknowledgement');}return metadata(key);}};
}
export function harness({live=false,envCap='0',dbCap=0,fetcher=async()=>{throw new Error('Unexpected network request');}}={}) {
  const db=database(),r2=bucket();let clock=1800000000000;
  if(dbCap!==null)db.raw.prepare('INSERT INTO budget_policy VALUES (1,?,?)').run(dbCap,clock);
  const runtime={db,bucket:r2,config:readServerConfig({APP_ORIGIN:'https://studio.test',LIVE_GENERATION_ENABLED:String(live),GENERATION_BUDGET_USD:envCap,FAL_KEY:'isolated-test-key'}),fetcher,now:()=>clock};
  return {runtime,db,r2,advance(ms){clock+=ms;},async request(path,{method='GET',cookie,body,headers={},raw}={}) {
    const h={...headers};if(cookie)h.Cookie=cookie;
    if(body!==undefined) {h['Content-Type']='application/json';body=JSON.stringify(body);}
    if(method!=='GET'&&method!=='HEAD'&&!('Origin' in h))h.Origin='https://studio.test';
    const req=new Request(`https://studio.test${path}`,{method,headers:h,body:raw??body,...(raw instanceof ReadableStream?{duplex:'half'}:{})});
    return handle(req,runtime);
  }};
}
export async function session(h) {const r=await h.request('/api/guest',{method:'POST',body:{}});if(r.status!==201)throw new Error(await r.text());return r.headers.get('Set-Cookie').split(';')[0];}
export async function project(h,cookie,draft={operation:'text_to_image',prompt:'A quiet dune at sunrise',presetId:null,parentAssetId:null}) {const id=crypto.randomUUID();const r=await h.request('/api/projects',{method:'POST',cookie,body:{id,title:'Test frame',draft}});if(r.status!==201)throw new Error(await r.text());return (await r.json()).data;}
export const imageBytes=()=>new Uint8Array(readFileSync(new URL('../../public/samples/dune-light.jpg',import.meta.url)));
