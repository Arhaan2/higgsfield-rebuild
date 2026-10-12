// Pure integration boundary checks. Actual browser/save/export evidence is recorded separately.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';
const mod = { exports: {} };
const code = ts.transpileModule(fs.readFileSync('src/client/movement-edit.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
vm.runInNewContext(`(function(exports){${code}\n})`)(mod.exports);
const { movementContextKey, replaceMovementText } = mod.exports;
const image = Object.freeze({ operation: 'text_to_image', prompt: 'Keep this still', parentAssetId: null, presetId: null });
const motion = Object.freeze({ operation: 'image_to_video', prompt: '  Café 夜空\n```literal```\n  ', parentAssetId: 'parent', presetId: 'preset', startAssetId: 'reference' });
const buffer = Object.freeze({ title: 'Original title', operation: 'image_to_video', drafts: Object.freeze({ text_to_image: image, image_to_video: motion }) });
const key = movementContextKey('project-a', buffer);
let count = 0;
function check(label, fn) { fn(); count++; console.log('PASS ' + label); }
check('replacement changes only the motion prompt and preserves exact before text', () => {
  const result = replaceMovementText(buffer, 'project-a', 'Push in slowly.', key);
  assert.equal(result.replacement.before, motion.prompt);
  assert.equal(result.buffer.title, buffer.title);
  assert.equal(result.buffer.operation, buffer.operation);
  assert.equal(result.buffer.drafts.text_to_image, image);
  assert.equal(result.buffer.drafts.image_to_video.startAssetId, 'reference');
  assert.equal(result.buffer.drafts.image_to_video.parentAssetId, 'parent');
  assert.equal(result.buffer.drafts.image_to_video.presetId, 'preset');
  assert.equal(motion.prompt, '  Café 夜空\n```literal```\n  ');
});
check('latest buffer supplies before text even when the rendered proposal was older', () => {
  const current = { ...buffer, drafts: { ...buffer.drafts, image_to_video: { ...motion, prompt: 'typed just now' } } };
  assert.equal(replaceMovementText(current, 'project-a', 'Pan slowly.', key).replacement.before, 'typed just now');
});
check('valid guarded undo restores Unicode multiline and whitespace exactly', () => {
  const applied = replaceMovementText(buffer, 'project-a', 'Locked frame.', key);
  const undone = replaceMovementText(applied.buffer, 'project-a', applied.replacement.before, key, applied.replacement.after);
  assert.equal(undone.buffer.drafts.image_to_video.prompt, motion.prompt);
});
check('stale undo cannot discard typing after replacement', () => {
  const current = { ...buffer, drafts: { ...buffer.drafts, image_to_video: { ...motion, prompt: 'newer typing' } } };
  const result = replaceMovementText(current, 'project-a', 'old text', key, 'Locked frame.');
  assert.equal(result.buffer, current); assert.equal(result.replacement, null);
});
for (const field of ['startAssetId', 'parentAssetId', 'presetId']) check(`${field} change rejects the old context`, () => {
  const current = { ...buffer, drafts: { ...buffer.drafts, image_to_video: { ...motion, [field]: 'changed' } } };
  const result = replaceMovementText(current, 'project-a', 'proposal', key);
  assert.equal(result.buffer, current); assert.equal(result.replacement, null);
});
check('project changes reject old-context replacement', () => {
  assert.equal(replaceMovementText(buffer, 'project-b', 'proposal', key).replacement, null);
});
check('inactive motion text cannot be changed from an image task', () => {
  const current = { ...buffer, operation: 'text_to_image' };
  assert.equal(replaceMovementText(current, 'project-a', 'proposal', movementContextKey('project-a', current)).replacement, null);
});
check('2500 Unicode code points are accepted without truncation', () => {
  const text = '🎬'.repeat(2500);
  assert.equal(replaceMovementText(buffer, 'project-a', text, key).buffer.drafts.image_to_video.prompt, text);
});
check('over-limit replacement leaves the exact buffer intact', () => {
  const result = replaceMovementText(buffer, 'project-a', '🎬'.repeat(2501), key);
  assert.equal(result.buffer, buffer); assert.equal(result.replacement, null);
});
check('oversized latest original cannot be replaced with text that would make Undo impossible', () => {
  const current = { ...buffer, drafts: { ...buffer.drafts, image_to_video: { ...motion, prompt: '🎬'.repeat(2501) } } };
  const result = replaceMovementText(current, 'project-a', 'proposal', key);
  assert.equal(result.buffer, current); assert.equal(result.replacement, null);
});
console.log(`\n${count} movement integration checks passed.`);
