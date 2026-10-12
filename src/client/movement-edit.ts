import type { EditorBuffer } from "./recovery";
import type { PromptReplacement } from "./prompt-directions";

/** The draft relationship identifies an editing context; ordinary typing does not. */
export function movementContextKey(projectId: string | null, buffer: EditorBuffer): string {
  const draft = buffer.drafts[buffer.operation];
  return JSON.stringify([projectId, buffer.operation, draft.presetId, draft.parentAssetId,
    draft.operation === "image_to_video" ? draft.startAssetId : null]);
}

/** Called inside the editor's synchronous functional update, against its latest buffer. */
export function replaceMovementText(buffer: EditorBuffer, projectId: string | null, text: string,
  expectedContextKey: string, expectedCurrentPrompt?: string): { buffer: EditorBuffer; replacement: PromptReplacement | null } {
  const current = buffer.drafts[buffer.operation];
  if (buffer.operation !== "image_to_video" || current.operation !== "image_to_video"
    || movementContextKey(projectId, buffer) !== expectedContextKey || [...text].length > 2500
    || [...current.prompt].length > 2500
    || (expectedCurrentPrompt !== undefined && current.prompt !== expectedCurrentPrompt)) {
    return { buffer, replacement: null };
  }
  const replacement = { contextKey: expectedContextKey, before: current.prompt, after: text };
  return {
    buffer: { ...buffer, drafts: { ...buffer.drafts, image_to_video: { ...current, prompt: text } } },
    replacement,
  };
}
