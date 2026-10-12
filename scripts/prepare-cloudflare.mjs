// Prepare a deployment config from a real build and verified resource identifiers.
// This script creates no resource, logs in nowhere, and makes no network request.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
const {values} = parseArgs({options: {
  help:{type:'boolean'}, 'worker-name':{type:'string'}, account:{type:'string'}, database:{type:'string'},
  'database-name':{type:'string'}, bucket:{type:'string'}, origin:{type:'string'},
}});
if (values.help) {
  console.log('node scripts/prepare-cloudflare.mjs --worker-name VERIFIED_WORKER_NAME --account REAL_ACCOUNT_ID --database REAL_D1_UUID --database-name REAL_D1_NAME --bucket REAL_R2_NAME --origin VERIFIED_HTTPS_ORIGIN');
  process.exit(0);
}
if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(values['worker-name'] || '')) throw new Error('Supply the verified Worker name after checking collisions.');
if (!/^[a-f0-9]{32}$/i.test(values.account || '')) throw new Error('Supply the verified Cloudflare account ID.');
if (!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(values.database || '') || values.database === '00000000-0000-4000-8000-000000000000') throw new Error('Supply the real D1 database UUID; local placeholder IDs cannot be deployed.');
if (!/^[a-z0-9][a-z0-9_-]{1,62}$/.test(values['database-name'] || '')) throw new Error('Supply the verified D1 name.');
if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(values.bucket || '')) throw new Error('Supply the verified R2 bucket name.');
const origin = new URL(values.origin || 'invalid');
if (origin.protocol !== 'https:' || origin.username || origin.password || origin.search || origin.hash || origin.pathname !== '/') throw new Error('Supply the verified HTTPS application origin.');
const built = JSON.parse(await readFile('dist/server/wrangler.json','utf8'));
if (!built.no_bundle || built.main !== 'index.js') throw new Error('Unexpected build layout; inspect before preparing deployment.');
const config = {
  $schema:resolve('node_modules/wrangler/config-schema.json'),
  name:values['worker-name'], account_id:values.account,
  main:resolve('dist/server/index.js'), no_bundle:true, rules:built.rules,
  compatibility_date:built.compatibility_date,
  compatibility_flags:built.compatibility_flags,
  assets:{directory:resolve('dist/client')},
  observability:{enabled:true,head_sampling_rate:1},
  vars:{APP_ORIGIN:origin.origin,LIVE_GENERATION_ENABLED:'false',GENERATION_BUDGET_USD:'0'},
  d1_databases:[{binding:'DB',database_name:values['database-name'],database_id:values.database}],
  r2_buckets:[{binding:'BUCKET',bucket_name:values.bucket}],
};
await mkdir('.cache/cloudflare',{recursive:true});
await writeFile('.cache/cloudflare/wrangler.json',JSON.stringify(config,null,2)+'\n');
console.log('Prepared .cache/cloudflare/wrangler.json with live generation disabled. No deployment or migration was run.');
