// Real zero-spend HTTP integration checks. Creates disposable, isolated guest work.
// No live provider call is permitted: policy must be disabled before any mutation.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const origin = new URL(process.argv[2] || 'http://127.0.0.1:5173').origin;
const output = process.argv[3];
const checks = [];
const req = (path, options = {}) => fetch(origin + path, { ...options, signal: AbortSignal.timeout(20000) });
const body = async response => (await response.json()).data;
function client() {
  let cookie = '';
  return async (path, { method = 'GET', json, raw, headers = {} } = {}) => {
    const response = await req(path, { method, headers: { ...(cookie ? { Cookie: cookie } : {}), ...(method !== 'GET' && method !== 'HEAD' ? { Origin: origin } : {}), ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: raw ?? (json !== undefined ? JSON.stringify(json) : undefined) });
    const setCookie = response.headers.get('Set-Cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    return response;
  };
}
async function check(name, run) {
  const started = Date.now();
  try { await run(); checks.push({ name, result: 'pass', ms: Date.now() - started }); }
  catch (error) { checks.push({ name, result: 'fail', detail: error.message }); throw error; }
}
try {
  const capabilities = await body(await req('/api/capabilities'));
  assert.equal(capabilities.liveGeneration.enabled, false);
  assert.equal(capabilities.liveGeneration.budgetLimitMicroUsd, 0);
  checks.push({ name: 'Public server policy is disabled with zero cap', result: 'pass' });
  const a = client(), b = client();
  await check('Cross-origin writes rejected before session creation', async () => {
    const response = await a('/api/guest', { method: 'POST', json: {}, headers: { Origin: 'https://untrusted.invalid' } });
    assert.equal(response.status, 403);
  });
  await check('Two separate guest sessions created', async () => {
    for (const c of [a, b]) {
      const response = await c('/api/guest', { method: 'POST', json: {} });
      assert.equal(response.status, 201);
      assert.match(response.headers.get('Set-Cookie'), /HttpOnly/);
      if (origin.startsWith('https:')) assert.match(response.headers.get('Set-Cookie'), /Secure/);
    }
  });
  const id = randomUUID(), assetId = randomUUID();
  const draft = { operation: 'image_to_video', prompt: 'A slow camera move across the dunes.', presetId: null, parentAssetId: null, startAssetId: null };
  await check('Draft saved and retrievable; stale revision rejected', async () => {
    assert.equal((await a('/api/projects', { method: 'POST', json: { id, title: 'HTTP verification shot', draft } })).status, 201);
    const loaded = await body(await a(`/api/projects/${id}`));
    assert.deepEqual(loaded.project.draft, draft);
    assert.equal((await a(`/api/projects/${id}`, { method: 'PATCH', json: { expectedRevision: 1, title: 'Retained verification shot' } })).status, 200);
    assert.equal((await a(`/api/projects/${id}`, { method: 'PATCH', json: { expectedRevision: 1, title: 'Stale write' } })).status, 409);
  });
  const bytes = await readFile(new URL('../public/samples/dune-light.jpg', import.meta.url));
  let asset;
  await check('Valid raw JPEG persists; retry returns same asset', async () => {
    const upload = () => a(`/api/projects/${id}/uploads?assetId=${assetId}&filename=dune-start.jpg`, { method: 'POST', raw: bytes, headers: { 'Content-Type': 'image/jpeg' } });
    const response = await upload();
    assert.equal(response.status, 201, await response.clone().text());
    asset = await body(response);
    assert.equal(asset.width, 1600);
    assert.equal(asset.height, 2397);
    assert.equal((await upload()).status, 200);
  });
  await check('Invalid image rejected without replacing valid media', async () => {
    assert.equal((await a(`/api/projects/${id}/uploads?assetId=${randomUUID()}&filename=bad.jpg`, { method: 'POST', raw: new Uint8Array([1, 2, 3]), headers: { 'Content-Type': 'image/jpeg' } })).status, 422);
    assert.equal((await body(await a(`/api/projects/${id}`))).assets.length, 1);
  });
  await check('Private range/HEAD/download return actual bytes', async () => {
    const ranged = await a(`/api/assets/${assetId}/media`, { headers: { Range: 'bytes=0-1023' } });
    assert.equal(ranged.status, 206);
    assert.equal(ranged.headers.get('Content-Range'), `bytes 0-1023/${bytes.length}`);
    assert.deepEqual(Buffer.from(await ranged.arrayBuffer()), bytes.subarray(0, 1024));
    const head = await a(`/api/assets/${assetId}/download`, { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(Number(head.headers.get('Content-Length')), bytes.length);
    assert.match(head.headers.get('Content-Disposition'), /^attachment;/);
    const downloaded = Buffer.from(await (await a(`/api/assets/${assetId}/download`)).arrayBuffer());
    assert.equal(createHash('sha256').update(downloaded).digest('hex'), createHash('sha256').update(bytes).digest('hex'));
  });
  await check('Other guest cannot read project, asset, media, or download', async () => {
    for (const path of [`/api/projects/${id}`, `/api/assets/${assetId}`, `/api/assets/${assetId}/media`, `/api/assets/${assetId}/download`]) assert.equal((await b(path)).status, 404);
  });
  await check('Reference and draft survive a fresh server read', async () => {
    const updated = { ...draft, startAssetId: assetId, parentAssetId: assetId };
    assert.equal((await a(`/api/projects/${id}`, { method: 'PATCH', json: { expectedRevision: 2, draft: updated } })).status, 200);
    const loaded = await body(await a(`/api/projects/${id}`));
    assert.deepEqual(loaded.project.draft, updated);
    assert.equal(loaded.assets[0].id, assetId);
  });
  await check('Disabled generation returns 403 and creates no job', async () => {
    const response = await a(`/api/projects/${id}/jobs`, { method: 'POST', json: { requestKey: randomUUID(), draftRevision: 3 } });
    assert.equal(response.status, 403);
    assert.equal((await response.json()).error.code, 'LIVE_DISABLED');
    assert.equal((await body(await a(`/api/projects/${id}`))).jobs.length, 0);
  });
  await check('Prepared catalog remains separate from private work', async () => {
    const sample = await body(await req('/api/samples'));
    assert.ok(sample.assets.every(asset => asset.source === 'sample' && asset.projectId === null && asset.sourceJobId === null));
  });
} catch (error) {
  process.exitCode = 1;
  console.error(error.message);
} finally {
  const result = { checkedAt: new Date().toISOString(), origin, sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), workingTreeDirty: Boolean(execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()), kind: 'real HTTP zero-spend integration; no live generation', checks };
  if (output) await writeFile(output, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
}
