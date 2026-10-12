// Pure recovery checks + existing isolated SQLite/API harness. No network, browser or provider.
// Run: node src/client/checks/duplicate-shot.mjs
import assert from 'node:assert/strict';
await import('../../../tests/server/register.mjs');
const { createDuplicateAttempt, readDuplicateAttempt, persistDuplicateAttempt, clearDuplicateAttempt, DUPLICATE_RECOVERY_KEY, DuplicateRecoveryError } = await import('../duplicate-shot.ts');
const { harness, session, project, imageBytes } = await import('../../../tests/server/harness.mjs');
let checks = 0;
async function check(name, run) { await run(); checks++; console.log('PASS ' + name); }
const source = (operation = 'text_to_image') => ({
  id: crypto.randomUUID(), title: 'Amber study', revision: 7, preferredAssetId: 'old-output',
  draft: { operation, prompt: 'Hold the horizon steady.', presetId: null, parentAssetId: 'retained-image', ...(operation === 'image_to_video' ? { startAssetId: 'retained-image' } : {}) },
  createdAt: '2026-10-12T00:00:00Z', updatedAt: '2026-10-12T00:00:00Z', jobs: [{ requestKey: 'never-copy' }], assets: [{ id: 'never-copy' }],
});
const storage = () => { const values = new Map(); return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }; };
for (const operation of ['text_to_image', 'image_to_video']) await check(`${operation}: only independent ID, bounded title and saved draft enter frozen payload`, () => {
  const original = source(operation), before = JSON.stringify(original), id = crypto.randomUUID();
  const attempt = createDuplicateAttempt(original, id);
  assert.deepEqual(Object.keys(attempt.payload).sort(), ['draft', 'id', 'title']);
  assert.equal(attempt.payload.id, id); assert.notEqual(id, original.id);
  assert.deepEqual(attempt.payload.draft, original.draft); assert.equal(attempt.payload.title, 'Amber study — Copy');
  assert.equal(Object.isFrozen(attempt), true); assert.equal(Object.isFrozen(attempt.payload), true); assert.equal(Object.isFrozen(attempt.payload.draft), true);
  assert.throws(() => { attempt.payload.draft.prompt = 'mutated'; }, TypeError);
  assert.equal(JSON.stringify(original), before);
});
await check('80-unit title boundary never splits a surrogate pair, including repeated copies', () => {
  for (const title of ['a'.repeat(80), '😀'.repeat(40), 'a'.repeat(72) + '😀ab', 'Amber — Copy']) {
    let saved = { ...source(), title };
    for (let i = 0; i < 5; i++) {
      const next = createDuplicateAttempt(saved, crypto.randomUUID()).payload;
      assert(next.title.length <= 80); assert(next.title.endsWith(' — Copy')); assert(next.title.isWellFormed());
      saved = { ...saved, ...next };
    }
  }
});
await check('invalid source, draft or reused/invalid UUID is rejected before persistence', () => {
  const original = source();
  for (const bad of [{ ...original, id: 'not-uuid' }, { ...original, title: '' }, { ...original, draft: { ...original.draft, prompt: 'x'.repeat(2501) } }, { ...original, draft: { ...original.draft, requestKey: 'unwanted' } }]) {
    assert.throws(() => createDuplicateAttempt(bad, crypto.randomUUID()));
  }
  for (const id of [original.id, 'bad']) assert.throws(() => createDuplicateAttempt(original, id));
});
await check('dedicated durable entry restores exact ID/payload and leaves Studio recovery untouched', () => {
  const target = storage(), attempt = createDuplicateAttempt(source('image_to_video'), crypto.randomUUID());
  target.setItem('frame-studio:recovery:v1:new', 'unrelated editor');
  persistDuplicateAttempt(attempt, target); const first = target.getItem(DUPLICATE_RECOVERY_KEY);
  const restored = readDuplicateAttempt(target); assert.deepEqual(restored, attempt); assert.notEqual(restored, attempt);
  persistDuplicateAttempt(restored, target); assert.equal(target.getItem(DUPLICATE_RECOVERY_KEY), first);
  assert(clearDuplicateAttempt(restored, target)); assert.equal(readDuplicateAttempt(target), null);
  assert.equal(target.getItem('frame-studio:recovery:v1:new'), 'unrelated editor');
});
await check('blocked reads/writes and silent storage drops are failures, never successful recovery', () => {
  const attempt = createDuplicateAttempt(source(), crypto.randomUUID());
  for (const target of [
    { getItem() { throw new Error('denied'); }, setItem() {}, removeItem() {} },
    { getItem() { return null; }, setItem() { throw new Error('full'); }, removeItem() {} },
    { getItem() { return null; }, setItem() {}, removeItem() {} },
  ]) assert.throws(() => persistDuplicateAttempt(attempt, target), DuplicateRecoveryError);
});
await check('malformed recovery or an alternate unfinished attempt cannot be silently overwritten', () => {
  const target = storage(), attempt = createDuplicateAttempt(source(), crypto.randomUUID());
  for (const raw of ['{bad', '{}', JSON.stringify({ ...attempt, payload: { ...attempt.payload, preferredAssetId: 'private' } })]) {
    target.setItem(DUPLICATE_RECOVERY_KEY, raw);
    assert.throws(() => readDuplicateAttempt(target), DuplicateRecoveryError);
    assert.throws(() => persistDuplicateAttempt(attempt, target), DuplicateRecoveryError);
    assert.equal(target.getItem(DUPLICATE_RECOVERY_KEY), raw);
  }
  target.values.clear(); persistDuplicateAttempt(attempt, target);
  const another = createDuplicateAttempt(source(), crypto.randomUUID());
  assert.throws(() => persistDuplicateAttempt(another, target), DuplicateRecoveryError);
  assert.equal(clearDuplicateAttempt(another, target), false); assert.deepEqual(readDuplicateAttempt(target), attempt);
});
await check('failed acknowledgement cleanup keeps the recoverable attempt', () => {
  const target = storage(), attempt = createDuplicateAttempt(source(), crypto.randomUUID());
  persistDuplicateAttempt(attempt, target); target.removeItem = () => { throw new Error('blocked'); };
  assert.equal(clearDuplicateAttempt(attempt, target), false); assert.deepEqual(readDuplicateAttempt(target), attempt);
});
const data = async response => (await response.json()).data;
for (const operation of ['text_to_image', 'image_to_video']) await check(`isolated real API: ${operation} copy retains same-owner reference, zero outputs/jobs, null preference, independent edits/reload`, async () => {
  let outbound = 0; const h = harness({ fetcher: async () => { outbound++; throw new Error('Unexpected external call'); } });
  try {
    const cookie = await session(h), original = await project(h, cookie);
    const referenceId = crypto.randomUUID();
    const upload = await h.request(`/api/projects/${original.id}/uploads?assetId=${referenceId}&filename=frame.jpg`, { method: 'POST', cookie, raw: imageBytes(), headers: { 'Content-Type': 'image/jpeg' } });
    assert.equal(upload.status, 201);
    const draft = { operation, prompt: 'A saved creative direction', presetId: null, parentAssetId: referenceId, ...(operation === 'image_to_video' ? { startAssetId: referenceId } : {}) };
    const saved = await data(await h.request(`/api/projects/${original.id}`, { method: 'PATCH', cookie, body: { expectedRevision: 1, title: 'Original reference study', draft, preferredAssetId: referenceId } }));
    const before = await data(await h.request(`/api/projects/${original.id}`, { cookie }));
    const attempt = createDuplicateAttempt(saved, crypto.randomUUID());
    const created = await h.request('/api/projects', { method: 'POST', cookie, body: attempt.payload });
    assert.equal(created.status, 201); const copy = await data(created);
    assert.equal(copy.preferredAssetId, null); assert.equal(copy.revision, 1); assert.notEqual(copy.id, original.id);
    const reloaded = await data(await h.request(`/api/projects/${copy.id}`, { cookie }));
    assert.deepEqual(reloaded.project.draft, draft); assert.deepEqual(reloaded.jobs, []); assert.deepEqual(reloaded.assets, []);
    assert.equal((await h.request(`/api/assets/${referenceId}`, { cookie })).status, 200);
    const edit = await h.request(`/api/projects/${copy.id}`, { method: 'PATCH', cookie, body: { expectedRevision: 1, title: 'Variation', draft: { ...draft, prompt: 'A different direction' } } });
    assert.equal(edit.status, 200);
    assert.deepEqual(await data(await h.request(`/api/projects/${original.id}`, { cookie })), before);
    const stranger = await session(h);
    assert.equal((await h.request('/api/projects', { method: 'POST', cookie: stranger, body: { ...attempt.payload, id: crypto.randomUUID() } })).status, 404);
    assert.equal(h.r2.calls.put, 1); assert.equal(outbound, 0); assert.equal(h.runtime.config.liveEnabled, false);
  } finally { h.db.raw.close(); }
});
await check('isolated real API: lost acknowledgement replay succeeds at quota 20 with same frozen ID/payload after original edit', async () => {
  const h = harness();
  try {
    const cookie = await session(h), original = await project(h, cookie);
    for (let i = 0; i < 18; i++) await project(h, cookie);
    const target = storage(), attempt = createDuplicateAttempt(original, crypto.randomUUID()); persistDuplicateAttempt(attempt, target);
    assert.equal((await h.request('/api/projects', { method: 'POST', cookie, body: attempt.payload })).status, 201);
    const changed = await h.request(`/api/projects/${original.id}`, { method: 'PATCH', cookie, body: { expectedRevision: 1, title: 'Source edited after copy' } }); assert.equal(changed.status, 200);
    assert.equal((await h.request('/api/projects', { method: 'POST', cookie, body: { ...attempt.payload, id: crypto.randomUUID() } })).status, 429);
    const restored = readDuplicateAttempt(target);
    assert.equal((await h.request(`/api/projects/${restored.sourceId}`, { cookie })).status, 200);
    const replay = await h.request('/api/projects', { method: 'POST', cookie, body: restored.payload });
    assert.equal(replay.status, 200); assert.equal((await data(replay)).id, attempt.payload.id);
    assert.equal(h.db.raw.prepare('SELECT count(*) AS n FROM projects').get().n, 20);
    assert.deepEqual((await data(await h.request(`/api/projects/${attempt.payload.id}`, { cookie }))).jobs, []);
    const different = await h.request('/api/projects', { method: 'POST', cookie, body: { ...attempt.payload, title: 'Silently replaced payload' } }); assert.equal(different.status, 409);
  } finally { h.db.raw.close(); }
});
console.log(`${checks} duplicate helper/API checks passed; isolated SQLite and mock storage; no browser/provider/network calls.`);
