import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { harness, session, project, imageBytes } from './harness.mjs';
import { PRESETS, SAMPLE_HASHES } from '../../src/catalog/samples.ts';
import { IMAGE_MODEL, VIDEO_MODEL } from '../../src/contracts/studio.ts';

// Isolated SQLite, mocked R2/fetch, and prepared fixture bytes only. No live generation.
const data = async response => {
  const body = await response.json();
  assert.ok(response.ok, JSON.stringify(body));
  return body.data;
};
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
class TestFixedLengthStream {
  constructor(length) {
    let count = 0;
    const stream = new TransformStream({
      transform(chunk, controller) { count += chunk.length; assert.ok(count <= length); controller.enqueue(chunk); },
      flush() { assert.equal(count, length); },
    });
    this.readable = stream.readable;
    this.writable = stream.writable;
  }
}

test('Mocked creative loop retains generated-image bytes, cross-project lineage, old jobs and downloads through video reuse', async () => {
  const originalStream = globalThis.FixedLengthStream;
  globalThis.FixedLengthStream = TestFixedLengthStream;
  try {
    const image = imageBytes();
    const video = new Uint8Array(readFileSync(new URL('../../public/samples/dune-flight.mp4', import.meta.url)));
    const submissions = [];
    const h = harness({ live: true, envCap: '1', dbCap: 1000000, fetcher: async (url, init) => {
      const u = String(url);
      if (init?.method === 'POST') {
        const input = JSON.parse(init.body);
        submissions.push({ url: u, input });
        return Response.json({ request_id: u.endsWith(IMAGE_MODEL) ? 'mock-image' : 'mock-video' });
      }
      if (u.endsWith('/status')) return Response.json({ status: 'COMPLETED' });
      if (u.includes('/requests/mock-image')) return Response.json({ images: [{ url: 'https://fal.media/fixture.jpg', content_type: 'image/jpeg', width: 1280, height: 720 }], seed: 123 });
      if (u.includes('/requests/mock-video')) return Response.json({ video: { url: 'https://fal.media/fixture.mp4', content_type: 'video/mp4' } });
      if (u === 'https://fal.media/fixture.jpg') return new Response(image, { headers: { 'Content-Type': 'image/jpeg' } });
      if (u === 'https://fal.media/fixture.mp4') return new Response(video, { headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(video.length) } });
      throw new Error(`Unexpected mocked request: ${u}`);
    } });
    const cookie = await session(h);
    assert.equal(PRESETS.length, 3);
    const presetProjects = [];
    for (const preset of PRESETS) {
      const saved = await project(h, cookie, preset.draft);
      assert.deepEqual(saved.draft, preset.draft);
      presetProjects.push(saved);
    }
    const source = presetProjects[0];
    const submit = async p => data(await h.request(`/api/projects/${p.id}/jobs`, { method: 'POST', cookie, body: { requestKey: crypto.randomUUID(), draftRevision: p.revision } }));
    const finish = async job => {
      h.advance(6000);
      const value = await data(await h.request(`/api/jobs/${job.id}/refresh`, { method: 'POST', cookie, body: {} }));
      assert.equal(value.status, 'succeeded');
      return value;
    };
    const imageJob = await finish(await submit(source));
    const sourceDetail = await data(await h.request(`/api/projects/${source.id}`, { cookie }));
    const imageAsset = sourceDetail.assets[0];
    assert.equal(imageAsset.sourceJobId, imageJob.id);
    assert.deepEqual([imageAsset.width, imageAsset.height], [1600, 2397]);
    assert.deepEqual(imageJob.resultMetadata, { seed: 123, width: 1600, height: 2397, durationSeconds: null });
    assert.deepEqual(imageJob.snapshot.settings.image_size, { width: 1280, height: 720 });

    const motionDraft = { operation: 'image_to_video', prompt: 'A gentle push forward', presetId: null, startAssetId: imageAsset.id, parentAssetId: imageAsset.id };
    const motion = await project(h, cookie, motionDraft);
    const videoJob = await finish(await submit(motion));
    assert.equal(submissions.length, 2);
    assert.equal(submissions[1].url, `https://queue.fal.run/${VIDEO_MODEL}`);
    assert.equal(digest(Buffer.from(submissions[1].input.image_url.split(',')[1], 'base64')), SAMPLE_HASHES['sample-dune-light']);
    assert.equal(submissions[1].input.duration, '5');
    assert.equal(submissions[1].input.tail_image_url, undefined);
    assert.equal(videoJob.snapshot.startAsset.id, imageAsset.id);
    assert.equal(videoJob.snapshot.parentAssetId, imageAsset.id);
    assert.equal(videoJob.snapshot.startAsset.sha256, digest(image));
    assert.equal(videoJob.resultMetadata.durationSeconds, null); // Request duration is not observed duration.

    const detail = await data(await h.request(`/api/projects/${motion.id}`, { cookie }));
    const videoAsset = detail.assets[0];
    assert.equal(videoAsset.kind, 'video');
    assert.equal(videoAsset.durationSeconds, null);
    const revised = { ...motionDraft, prompt: 'A slower camera move', parentAssetId: videoAsset.id };
    await data(await h.request(`/api/projects/${motion.id}`, { method: 'PATCH', cookie, body: { expectedRevision: motion.revision, draft: revised } }));
    const reopened = await data(await h.request(`/api/projects/${motion.id}`, { cookie }));
    assert.deepEqual(reopened.project.draft, revised);
    assert.deepEqual(reopened.jobs[0], videoJob);
    assert.deepEqual((await data(await h.request(`/api/projects/${source.id}`, { cookie }))).jobs[0], imageJob);
    assert.equal((await data(await h.request(`/api/assets/${imageAsset.id}`, { cookie }))).projectId, source.id);
    const stranger = await session(h);
    for (const [asset, bytes] of [[imageAsset, image], [videoAsset, video]]) {
      const response = await h.request(asset.downloadUrl, { cookie });
      assert.equal(response.status, 200);
      assert.match(response.headers.get('Content-Disposition'), /^attachment;/);
      assert.equal(digest(new Uint8Array(await response.arrayBuffer())), digest(bytes));
      assert.equal((await h.request(asset.mediaUrl, { cookie: stranger })).status, 404);
      assert.equal((await h.request(asset.downloadUrl, { cookie: stranger })).status, 404);
    }
    assert.equal(submissions.length, 2); // Saving a reuse draft never generates.
  } finally { globalThis.FixedLengthStream = originalStream; }
});

test('P4-01: confirmed failures without output must leave room to retry while preserving jobs and counted spend', async () => {
  const h = harness({ live: true, envCap: '1', dbCap: 1000000, fetcher: async (_url, init) =>
    init?.method === 'POST'
      ? Response.json({ request_id: crypto.randomUUID() })
      : Response.json({ status: 'COMPLETED', error: 'Controlled provider failure; no result' }),
  });
  const cookie = await session(h), p = await project(h, cookie);
  for (let i = 0; i < 5; i++) {
    const job = await data(await h.request(`/api/projects/${p.id}/jobs`, { method: 'POST', cookie, body: { requestKey: crypto.randomUUID(), draftRevision: p.revision } }));
    h.advance(6000);
    const failed = await data(await h.request(`/api/jobs/${job.id}/refresh`, { method: 'POST', cookie, body: {} }));
    assert.equal(failed.status, 'failed');
  }
  const retained = await data(await h.request(`/api/projects/${p.id}`, { cookie }));
  assert.equal(retained.assets.length, 0);
  assert.equal(retained.jobs.length, 5);
  assert.equal(h.db.raw.prepare("SELECT sum(reserve_micro_usd) AS used FROM jobs WHERE accounting_state != 'released'").get().used, 50000);
  const retry = await h.request(`/api/projects/${p.id}/jobs`, { method: 'POST', cookie, body: { requestKey: crypto.randomUUID(), draftRevision: p.revision } });
  assert.equal(retry.status, 202, `Confirmed failures left no outputs, but retry was denied: ${await retry.text()}`);
});
