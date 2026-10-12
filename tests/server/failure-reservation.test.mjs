import test from 'node:test';
import assert from 'node:assert/strict';
import { harness, session, project, imageBytes } from './harness.mjs';

// Every provider/R2 call is an isolated mock; no global fetch or live credentials.
const data = async response => {
  const body = await response.json();
  assert.ok(response.ok, JSON.stringify(body));
  return body.data;
};
const submit = (h, cookie, p, requestKey = crypto.randomUUID()) => h.request(`/api/projects/${p.id}/jobs`, {
  method: 'POST', cookie, body: { requestKey, draftRevision: p.revision },
});
const refresh = (h, cookie, id, retry = false) => h.request(`/api/jobs/${id}/${retry ? 'retry-transfer' : 'refresh'}`, {
  method: 'POST', cookie, body: {},
});
const row = (h, id) => h.db.raw.prepare('SELECT * FROM jobs WHERE id=?').get(id);
const reservation = (h, id) => h.db.raw.prepare('SELECT * FROM storage_reservations WHERE job_id=?').get(id);
const used = h => h.db.raw.prepare("SELECT sum(reserve_micro_usd) AS used FROM jobs WHERE accounting_state!='released'").get().used;
const failedStatus = () => Response.json({ status: 'COMPLETED', error: 'Controlled failure' });
const result = () => Response.json({ images: [{ url: 'https://fal.media/result.jpg', content_type: 'image/jpeg' }] });

test('Confirmed failure releases only its storage; history, owner boundaries, idempotency and spend caps survive', async () => {
  let posts = 0;
  const h = harness({ live: true, envCap: '0.03', dbCap: 30000, fetcher: async (_url, init) => {
    if (init?.method === 'POST') { posts++; return Response.json({ request_id: crypto.randomUUID() }); }
    return failedStatus();
  } });
  const cookie = await session(h), p = await project(h, cookie), key = crypto.randomUUID();
  const other = await session(h), q = await project(h, other);
  const job = await data(await submit(h, cookie, p, key));
  const otherJob = await data(await submit(h, other, q));
  const before = row(h, job.id), otherHold = reservation(h, otherJob.id);
  const upload = crypto.randomUUID();
  h.db.raw.prepare("INSERT INTO storage_reservations (id,guest_id,project_id,asset_id,bytes,state,created_at,updated_at) VALUES (?,?,?,?,1,'held',1,1)")
    .run(upload, before.guest_id, p.id, upload);
  h.advance(6000);
  assert.equal((await refresh(h, other, job.id)).status, 404);
  assert.equal(reservation(h, job.id).state, 'held');
  const failed = await data(await refresh(h, cookie, job.id));
  assert.equal(failed.status, 'failed');
  assert.equal(failed.error.code, 'PROVIDER_FAILED');
  assert.equal(reservation(h, job.id).state, 'released');
  assert.equal(reservation(h, job.id).bytes, 5000000);
  assert.deepEqual(reservation(h, otherJob.id), otherHold);
  assert.equal(h.db.raw.prepare('SELECT state FROM storage_reservations WHERE id=?').get(upload).state, 'held');
  const history = row(h, job.id);
  assert.equal(history.accounting_state, 'committed');
  assert.equal(history.reserve_micro_usd, 10000);
  assert.equal(history.lease_token, null);
  for (const field of ['id', 'guest_id', 'project_id', 'request_key', 'requested_revision', 'submit_hash', 'snapshot_json', 'provider_request_id', 'created_at']) {
    assert.equal(history[field], before[field], field);
  }
  assert.equal(used(h), 20000);
  assert.deepEqual(await data(await refresh(h, cookie, job.id)), failed);
  assert.equal((await data(await submit(h, cookie, p, key))).id, job.id);
  assert.equal(posts, 2);
  const retry = await data(await submit(h, cookie, p));
  assert.equal(retry.status, 'queued');
  h.advance(6000);
  await data(await refresh(h, cookie, retry.id));
  assert.equal(used(h), 30000);
  const denied = await submit(h, cookie, p);
  assert.equal(denied.status, 429);
  assert.equal((await denied.json()).error.code, 'BUDGET_EXHAUSTED');
  assert.equal(posts, 3);
  assert.deepEqual(row(h, job.id), history);
  const detail = await data(await h.request(`/api/projects/${p.id}`, { cookie }));
  assert.equal(detail.jobs.length, 2);
  assert.equal(detail.assets.length, 0);
  assert.deepEqual(detail.project, p);
});

test('Unknown POST and unavailable status retain storage and monetary holds', async () => {
  for (const unknown of [true, false]) {
    let calls = 0;
    const h = harness({ live: true, envCap: '1', dbCap: 1000000, fetcher: async (_url, init) => {
      calls++;
      if (unknown) throw new Error('Lost POST acknowledgement');
      return init?.method === 'POST' ? Response.json({ request_id: crypto.randomUUID() }) : new Response('Unavailable', { status: 503 });
    } });
    const cookie = await session(h), p = await project(h, cookie);
    const job = await data(await submit(h, cookie, p));
    h.advance(61000);
    const checked = await data(await refresh(h, cookie, job.id));
    assert.equal(checked.status, unknown ? 'submission_unknown' : 'queued');
    assert.equal(reservation(h, job.id).state, 'held');
    assert.equal(row(h, job.id).accounting_state, 'held');
    assert.equal(used(h), 10000);
    assert.equal(calls, unknown ? 1 : 2);
  }
});

for (const failure of ['result', 'transfer']) {
  test(`${failure} failure holds storage through retry, including contradictory provider status`, async () => {
    let posts = 0, statuses = 0, recover = false;
    const h = harness({ live: true, envCap: '1', dbCap: 1000000, fetcher: async (url, init) => {
      if (init?.method === 'POST') { posts++; return Response.json({ request_id: crypto.randomUUID() }); }
      if (String(url).endsWith('/status')) {
        statuses++;
        return !recover && statuses > 1 ? failedStatus() : Response.json({ status: 'COMPLETED' });
      }
      if (String(url).includes('queue.fal.run')) return failure === 'result' && !recover ? new Response('Unavailable', { status: 503 }) : result();
      return new Response(imageBytes(), { headers: { 'Content-Type': 'image/jpeg' } });
    } });
    const cookie = await session(h), p = await project(h, cookie);
    const job = await data(await submit(h, cookie, p));
    if (failure === 'transfer') h.r2.failNextAfterWrite();
    h.advance(6000);
    assert.equal((await data(await refresh(h, cookie, job.id))).status, 'transfer_failed');
    assert.equal(reservation(h, job.id).state, 'held');
    assert.equal(used(h), 10000);
    if (failure === 'result') {
      assert.equal(row(h, job.id).provider_output_json, null);
      assert.equal((await data(await refresh(h, cookie, job.id, true))).status, 'transfer_failed');
      assert.equal(reservation(h, job.id).state, 'held');
      assert.equal(row(h, job.id).lease_token, null);
    } else {
      assert.equal(h.r2.objects.size, 1); // Lost acknowledgement may already have retained bytes.
    }
    recover = true;
    assert.equal((await data(await refresh(h, cookie, job.id, true))).status, 'succeeded');
    assert.equal(reservation(h, job.id).state, 'stored');
    assert.equal(posts, 1);
    assert.equal(used(h), 10000);
  });
}

for (const successor of ['expired', 'queued', 'running', 'submission_unknown', 'transfer_failed', 'succeeded']) {
  test(`Stale confirmed failure cannot release storage after ${successor}`, async () => {
    let release, entered, polls = 0;
    const waiting = new Promise(resolve => { entered = resolve; });
    const h = harness({ live: true, envCap: '1', dbCap: 1000000, fetcher: async (url, init) => {
      if (init?.method === 'POST') return Response.json({ request_id: crypto.randomUUID() });
      if (String(url).endsWith('/status')) {
        if (++polls === 1) { entered(); return new Promise(resolve => { release = () => resolve(failedStatus()); }); }
        return Response.json({ status: successor === 'queued' ? 'IN_QUEUE' : successor === 'running' ? 'IN_PROGRESS' : 'COMPLETED' });
      }
      if (String(url).includes('queue.fal.run')) return result();
      if (successor === 'transfer_failed') throw new Error('Media unavailable');
      return new Response(imageBytes(), { headers: { 'Content-Type': 'image/jpeg' } });
    } });
    const cookie = await session(h), p = await project(h, cookie);
    const job = await data(await submit(h, cookie, p));
    h.advance(6000);
    const stale = refresh(h, cookie, job.id);
    await waiting;
    h.advance(successor === 'expired' ? 60000 : 61000);
    if (successor === 'submission_unknown') {
      h.db.raw.prepare("UPDATE jobs SET status='submission_unknown',lease_token=NULL,lease_expires_at=NULL WHERE id=?").run(job.id);
    } else if (successor !== 'expired') {
      assert.equal((await data(await refresh(h, cookie, job.id))).status, successor);
    }
    const current = row(h, job.id), held = reservation(h, job.id);
    release();
    await data(await stale);
    assert.deepEqual(row(h, job.id), current);
    assert.deepEqual(reservation(h, job.id), held);
    assert.equal(held.state, successor === 'succeeded' ? 'stored' : 'held');
    assert.equal(used(h), 10000);
  });
}

test('Stale failure cannot release storage while a successor still owns the active poll lease', async () => {
  let firstReady, secondReady, releaseFirst, releaseSecond, polls = 0;
  const firstWaiting = new Promise(resolve => { firstReady = resolve; });
  const secondWaiting = new Promise(resolve => { secondReady = resolve; });
  const h = harness({ live: true, envCap: '1', dbCap: 1000000, fetcher: async (_url, init) => {
    if (init?.method === 'POST') return Response.json({ request_id: crypto.randomUUID() });
    if (++polls === 1) {
      firstReady();
      return new Promise(resolve => { releaseFirst = () => resolve(failedStatus()); });
    }
    if (polls === 2) {
      secondReady();
      return new Promise(resolve => { releaseSecond = () => resolve(Response.json({ status: 'IN_PROGRESS' })); });
    }
    return failedStatus();
  } });
  const cookie = await session(h), p = await project(h, cookie);
  const job = await data(await submit(h, cookie, p));
  h.advance(6000);
  const stale = refresh(h, cookie, job.id);
  await firstWaiting;
  const firstLease = row(h, job.id).lease_token;
  h.advance(61000);
  const successor = refresh(h, cookie, job.id);
  await secondWaiting;
  const active = row(h, job.id), held = reservation(h, job.id);
  assert.notEqual(active.lease_token, firstLease);
  assert.ok(active.lease_expires_at > h.runtime.now());
  releaseFirst();
  await data(await stale);
  assert.deepEqual(row(h, job.id), active);
  assert.deepEqual(reservation(h, job.id), held);
  assert.equal(held.state, 'held');
  releaseSecond();
  assert.equal((await data(await successor)).status, 'running');
  h.advance(6000);
  assert.equal((await data(await refresh(h, cookie, job.id))).status, 'failed');
  assert.equal(reservation(h, job.id).state, 'released');
  assert.equal(used(h), 10000);
});

test('A failed terminal write rolls back the storage release; later refresh can complete both', async () => {
  const h = harness({ live: true, envCap: '1', dbCap: 1000000, fetcher: async (_url, init) =>
    init?.method === 'POST' ? Response.json({ request_id: crypto.randomUUID() }) : failedStatus(),
  });
  const cookie = await session(h), p = await project(h, cookie);
  const job = await data(await submit(h, cookie, p));
  // Fault injection in the isolated D1 adapter, without changing schema/triggers.
  const batch = h.db.batch.bind(h.db);
  let injected = false;
  h.db.batch = async statements => {
    const wrapped = statements.map(statement => ({ _all() {
      const value = statement._all();
      if (!injected && row(h, job.id).status === 'failed') {
        injected = true;
        throw new Error('Controlled terminal write failure');
      }
      return value;
    } }));
    return batch(wrapped);
  };
  h.advance(6000);
  assert.equal((await data(await refresh(h, cookie, job.id))).status, 'queued');
  assert.equal(injected, true);
  assert.equal(reservation(h, job.id).state, 'held');
  assert.equal(row(h, job.id).accounting_state, 'held');
  assert.equal(used(h), 10000);
  h.advance(16000);
  assert.equal((await data(await refresh(h, cookie, job.id))).status, 'failed');
  assert.equal(reservation(h, job.id).state, 'released');
  assert.equal(row(h, job.id).accounting_state, 'committed');
});
