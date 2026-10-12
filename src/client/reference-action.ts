import type { Draft } from "@/src/contracts/studio";

// Shared by the stage and details actions; never changes an asset or job snapshot.
export function referenceAction(motion: Draft, assetId: string, defaultPrompt: string) {
  const sameReference = motion.operation === "image_to_video" && motion.startAssetId === assetId;
  return {
    label: sameReference ? "Edit movement" : "Use as start frame",
    description: sameReference
      ? "Edit your existing movement draft. This does not generate a video."
      : "Changes the start frame in your draft and keeps your movement text. This does not generate a video.",
    draft: sameReference ? null : {
      operation: "image_to_video",
      prompt: motion.prompt.length ? motion.prompt : defaultPrompt,
      presetId: null,
      startAssetId: assetId,
      parentAssetId: assetId,
    } satisfies Draft,
  };
}
