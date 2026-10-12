import { z } from "zod";
import { projectCreateSchema, type Project } from "@/src/contracts/studio";

// Separate from Studio's editable recovery: this payload must never change after a POST.
export const DUPLICATE_RECOVERY_KEY = "frame-studio:duplicate-saved-shot:v1";
const attemptSchema = z.object({
  version: z.literal(1), sourceId: z.string().uuid(), payload: projectCreateSchema,
}).strict().refine(value => value.sourceId !== value.payload.id);
export type DuplicateAttempt = z.infer<typeof attemptSchema>;
type RecoveryStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export class DuplicateRecoveryError extends Error {
  constructor(message = "Copy recovery could not be saved in this browser. No new copy was sent. Enable browser storage and try again.") {
    super(message); this.name = "DuplicateRecoveryError";
  }
}
function freezeAttempt(value: DuplicateAttempt): DuplicateAttempt {
  Object.freeze(value.payload.draft); Object.freeze(value.payload); return Object.freeze(value);
}
export function createDuplicateAttempt(source: Project, id: string): DuplicateAttempt {
  const saved = projectCreateSchema.parse({ id: source.id, title: source.title, draft: source.draft });
  const suffix = " — Copy";
  // API title bounds count UTF-16 units; truncate only at complete code points.
  let title = "";
  for (const point of saved.title) { if ((title + point).length > 80 - suffix.length) break; title += point; }
  return freezeAttempt(attemptSchema.parse({ version: 1, sourceId: saved.id, payload: {
    id, title: title.trimEnd() + suffix, draft: saved.draft,
  } }));
}
export function readDuplicateAttempt(storage?: RecoveryStorage): DuplicateAttempt | null {
  try {
    const raw = (storage ?? localStorage).getItem(DUPLICATE_RECOVERY_KEY);
    if (raw === null) return null;
    return freezeAttempt(attemptSchema.parse(JSON.parse(raw)));
  } catch {
    throw new DuplicateRecoveryError("Saved copy recovery is unavailable in this browser. No new copy was sent. Restore access to browser storage and try again.");
  }
}
export function persistDuplicateAttempt(attempt: DuplicateAttempt, storage?: RecoveryStorage): void {
  try {
    const target = storage ?? localStorage;
    const validated = attemptSchema.parse(attempt);
    const previous = readDuplicateAttempt(target);
    const serialized = JSON.stringify(validated);
    if (previous && JSON.stringify(previous) !== serialized) {
      throw new DuplicateRecoveryError("Another copy is waiting for confirmation. Retry that saved copy before duplicating another shot.");
    }
    target.setItem(DUPLICATE_RECOVERY_KEY, serialized);
    if (target.getItem(DUPLICATE_RECOVERY_KEY) !== serialized) throw new DuplicateRecoveryError();
  } catch (cause) {
    if (cause instanceof DuplicateRecoveryError) throw cause;
    throw new DuplicateRecoveryError();
  }
}
// Conditional removal cannot erase a different attempt saved by another Library tab.
export function clearDuplicateAttempt(attempt?: DuplicateAttempt, storage?: RecoveryStorage): boolean {
  try {
    const target = storage ?? localStorage;
    if (attempt) {
      const current = readDuplicateAttempt(target);
      if (current && JSON.stringify(current) !== JSON.stringify(attempt)) return false;
    }
    target.removeItem(DUPLICATE_RECOVERY_KEY);
    return target.getItem(DUPLICATE_RECOVERY_KEY) === null;
  } catch { return false; }
}
