import type { Asset, Preset } from "@/src/contracts/studio";

const createdAt = "2026-10-12T01:35:00Z";
export const SAMPLE_ASSETS: Asset[] = [
  { id: "sample-dune-light", title: "Dune light", projectId: null, kind: "image", source: "sample", fileName: "dune-light.jpg", mimeType: "image/jpeg", byteSize: 187464, width: 1600, height: 2397, durationSeconds: null, sourceJobId: null, mediaUrl: "/samples/dune-light.jpg", downloadUrl: "/samples/dune-light.jpg", posterUrl: null, createdAt, attribution: { label: "Jacob Castle / Unsplash", url: "https://unsplash.com/photos/the-sun-is-setting-over-the-sand-dunes-ui_tS2Yd-i0" } },
  { id: "sample-dune-flight", title: "Dune flight", projectId: null, kind: "video", source: "sample", fileName: "dune-flight.mp4", mimeType: "video/mp4", byteSize: 11342355, width: 1920, height: 1080, durationSeconds: 14.996667, sourceJobId: null, mediaUrl: "/samples/dune-flight.mp4", downloadUrl: "/samples/dune-flight.mp4", posterUrl: "/samples/dune-flight.jpg", createdAt, attribution: { label: "Lukas Rodriguez / Pexels", url: "https://www.pexels.com/video/sand-dune-fpv-20081119/" } },
];
export const SAMPLE_HASHES: Record<string, string> = {
  "sample-dune-light": "4d5d695a1fc7745268274c89663550be54a7416942e56f13f6675a625584442a",
  "sample-dune-flight": "356a6ef6192ae00b955b82755c7c07cb6ff767da79995e574925e7c2a64e633e",
};
export const PRESETS: Preset[] = [
  { id: "dune-light", version: 1, title: "Chase the light", description: "Golden dunes. Long shadows. One quiet frame.", operation: "text_to_image", previewAssetId: "sample-dune-light", draft: { operation: "text_to_image", prompt: "A cinematic wide shot of sculptural desert dunes at sunrise, warm golden light tracing each ridge, deep soft shadows, distant mountains, fine film grain, natural colors, no people or text.", presetId: "dune-light", parentAssetId: null }, attribution: SAMPLE_ASSETS[0].attribution!, isPreparedSample: true },
  { id: "slow-reveal", version: 1, title: "A slow reveal", description: "Let a patient camera move uncover the scene.", operation: "image_to_video", previewAssetId: "sample-dune-light", draft: { operation: "image_to_video", prompt: "A slow, gentle camera push forward through the scene. Preserve the subject and natural lighting. Subtle atmospheric movement, smooth cinematic motion, no sudden cuts.", startAssetId: "sample-dune-light", presetId: "slow-reveal", parentAssetId: "sample-dune-light" }, attribution: SAMPLE_ASSETS[0].attribution!, isPreparedSample: true },
  { id: "desert-drift", version: 1, title: "Desert drift", description: "A low, floating journey across the landscape.", operation: "image_to_video", previewAssetId: "sample-dune-flight", draft: { operation: "image_to_video", prompt: "The camera glides slowly above the dunes, following the soft curves of the sand. Maintain warm natural light and stable terrain, with a calm floating movement and no cuts.", startAssetId: "sample-dune-light", presetId: "desert-drift", parentAssetId: "sample-dune-light" }, attribution: SAMPLE_ASSETS[1].attribution!, isPreparedSample: true },
];
