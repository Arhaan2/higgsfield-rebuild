export type CameraDirection = "push-in" | "pan" | "locked";

export type PromptReplacement = { contextKey: string; before: string; after: string };

export const MOVEMENT_TEXT_LIMIT = 2500;

export const CAMERA_DIRECTIONS: readonly {
  id: CameraDirection;
  label: string;
  prompt: string;
}[] = [
  {
    id: "push-in",
    label: "Push in",
    prompt: "Slowly push the camera toward the subject. Keep the movement smooth and the subject clearly framed.",
  },
  {
    id: "pan",
    label: "Pan across frame",
    prompt: "Slowly pan the camera from left to right across the frame. Keep the movement smooth and the horizon level.",
  },
  {
    id: "locked",
    label: "Locked frame",
    prompt: "Keep the camera locked in place. Hold the framing steady while the subject moves naturally.",
  },
];

/** Count Unicode code points without trimming, normalizing, or truncating the text. */
export function movementTextLength(text: string): number {
  return [...text].length;
}

/** Once discarded, a replacement cannot become undoable by typing its text again. */
export function retainPromptReplacement(
  replacement: PromptReplacement | null,
  contextKey: string,
  prompt: string,
): PromptReplacement | null {
  return replacement?.contextKey === contextKey && replacement.after === prompt ? replacement : null;
}
