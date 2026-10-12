import { draftSchema, emptyDraft, type Draft, type Operation } from "@/src/contracts/studio";
export type EditorBuffer = { title: string; operation: Operation; drafts: Record<Operation, Draft> };
export type PendingSubmission = { projectId: string; requestKey: string; draftRevision: number };
export type CreateAttempt = { id: string; title: string; draft: Draft };
export type Recovery = { buffer: EditorBuffer; revision: number | null; acknowledged: string | null; updatedAt: number; expiresAt: number; pending: PendingSubmission | null; creation?: CreateAttempt | null };
const PREFIX = "frame-studio:recovery:v1:";
const SESSION = "frame-studio:session-expiry";
export const freshBuffer = (): EditorBuffer => ({ title: "Untitled shot", operation: "image_to_video", drafts: { text_to_image: emptyDraft("text_to_image"), image_to_video: emptyDraft("image_to_video") } });
export const signature = (buffer: EditorBuffer): string => {
  const draft = buffer.drafts[buffer.operation];
  // Source objects have different property order after server validation. Compare content, not insertion order.
  return JSON.stringify({ title: buffer.title.trim(), operation: draft.operation, prompt: draft.prompt.trim(), presetId: draft.presetId, parentAssetId: draft.parentAssetId, startAssetId: draft.operation === "image_to_video" ? draft.startAssetId : null });
};
export function readRecovery(key: string): Recovery | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const value = JSON.parse(raw) as Recovery;
    if (value.expiresAt <= Date.now() || !["text_to_image", "image_to_video"].includes(value.buffer.operation) || typeof value.buffer.title !== "string") return null;
    if (!draftSchema.safeParse(value.buffer.drafts.text_to_image).success || !draftSchema.safeParse(value.buffer.drafts.image_to_video).success) return null;
    return value;
  } catch { return null; }
}
export function writeRecovery(key: string, value: Omit<Recovery, "updatedAt" | "expiresAt">): boolean {
  try {
    const sessionExpiry = Number(localStorage.getItem(SESSION));
    localStorage.setItem(PREFIX + key, JSON.stringify({ ...value, updatedAt: Date.now(), expiresAt: sessionExpiry > Date.now() ? sessionExpiry : Date.now() + 30 * 24 * 60 * 60 * 1000 }));
    return true;
  } catch { return false; }
}
export function removeRecovery(key: string) { try { localStorage.removeItem(PREFIX + key); } catch { /* In-memory editing remains available. */ } }
export function clearRecovery() {
  try { Object.keys(localStorage).filter(key => key.startsWith(PREFIX)).forEach(key => localStorage.removeItem(key)); localStorage.removeItem(SESSION); } catch { /* Private browsing may deny storage. */ }
}
export function rememberSession(expiresAt: string) {
  try {
    const next = new Date(expiresAt).getTime();
    const old = Number(localStorage.getItem(SESSION));
    if (old && old !== next) clearRecovery();
    localStorage.setItem(SESSION, String(next));
  } catch { /* Server saves still work without recovery storage. */ }
}
