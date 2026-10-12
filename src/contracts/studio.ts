// Coordinator-owned public interface v1. See docs/TECH-SPEC.md.
import { z } from "zod";

export type Operation = "text_to_image" | "image_to_video";
export type Draft =
  | { operation: "text_to_image"; prompt: string; presetId: string | null; parentAssetId: string | null }
  | { operation: "image_to_video"; prompt: string; presetId: string | null;
      startAssetId: string | null; parentAssetId: string | null };
// Draft prompt 0..2500 characters; submission requires 1..2500 after trim.
// Video draft may lack its image; submission cannot.
export type Project = {
  id: string; title: string; draft: Draft; revision: number;
  preferredAssetId: string | null; createdAt: string; updatedAt: string;
};
export type Asset = {
  title: string; posterUrl: string | null; attribution: { label: string; url: string | null } | null;
  id: string; projectId: string | null; kind: "image" | "video";
  source: "upload" | "generation" | "sample";
  fileName: string; mimeType: "image/jpeg" | "image/png" | "video/mp4";
  byteSize: number; width: number | null; height: number | null;
  durationSeconds: number | null; sourceJobId: string | null;
  mediaUrl: string; downloadUrl: string; createdAt: string;
};
export type Preset = {
  id: string; version: number; title: string; description: string; operation: Operation;
  previewAssetId: string; draft: Draft;
  attribution: { label: string; url: string | null }; isPreparedSample: true;
};
export type JobStatus = "prepared" | "submitting" | "submission_unknown" |
  "queued" | "running" | "storing" | "succeeded" | "failed" | "transfer_failed";
export type SnapshotBase = {
  schemaVersion: 1; provider: "fal"; parentAssetId: string | null;
  prompt: string; presetId: string | null; presetVersion: number | null;
};
export type Snapshot = SnapshotBase & (
  | { operation: "text_to_image"; modelId: "fal-ai/flux/schnell";
      startAsset: null; settings: {
        image_size: { width: 1280; height: 720 }; num_images: 1;
        num_inference_steps: 4; guidance_scale: 3.5;
        enable_safety_checker: true; output_format: "jpeg";
        acceleration: "none"; sync_mode: false;
      } }
  | { operation: "image_to_video";
      modelId: "fal-ai/kling-video/v2.5-turbo/pro/image-to-video";
      startAsset: { id: string; sha256: string; mimeType: "image/jpeg" | "image/png" };
      settings: { duration: "5"; negative_prompt: "blur, distort, and low quality";
        cfg_scale: 0.5 } }
);
export type Job = {
  id: string; projectId: string; requestKey: string; status: JobStatus;
  snapshot: Snapshot; outputAssetIds: string[];
  resultMetadata: { seed: number | null; width: number | null;
    height: number | null; durationSeconds: number | null } | null;
  error: { code: string; message: string; recovery: "none" | "refresh" | "retry_transfer" | "revise" | "contact_owner" } | null;
  nextPollAfterMs: number | null; lastCheckedAt: string | null;
  createdAt: string; updatedAt: string;
};
export type ApiResult<T> = { data: T; requestId: string };
export type ApiError = { error: {
  code: string; message: string; retryable: boolean;
  fields?: Record<string, string>; retryAfterSeconds?: number;
}; requestId: string };

export const IMAGE_MODEL = "fal-ai/flux/schnell" as const;
export const VIDEO_MODEL = "fal-ai/kling-video/v2.5-turbo/pro/image-to-video" as const;
export const IMAGE_SETTINGS = { image_size: { width: 1280, height: 720 }, num_images: 1,
  num_inference_steps: 4, guidance_scale: 3.5, enable_safety_checker: true,
  output_format: "jpeg", acceleration: "none", sync_mode: false } as const;
export const VIDEO_SETTINGS = { duration: "5", negative_prompt: "blur, distort, and low quality", cfg_scale: 0.5 } as const;
export const UPLOAD_LIMIT = 5_000_000;
export const textSchema = z.string().transform(s => s.trim()).refine(s => [...s].length <= 2500, "Use at most 2,500 characters.");
const assetIdSchema = z.string().min(1).max(80).nullable();
const commonDraft = { prompt: textSchema, presetId: z.string().max(80).nullable(), parentAssetId: assetIdSchema };
export const draftSchema = z.discriminatedUnion("operation", [
  z.object({ ...commonDraft, operation: z.literal("text_to_image") }).strict(),
  z.object({ ...commonDraft, operation: z.literal("image_to_video"), startAssetId: assetIdSchema }).strict(),
]);
export const projectCreateSchema = z.object({ id: z.string().uuid(), title: z.string().trim().min(1).max(80), draft: draftSchema }).strict();
export const projectPatchSchema = z.object({ expectedRevision: z.number().int().positive(), title: z.string().trim().min(1).max(80).optional(), draft: draftSchema.optional(), preferredAssetId: assetIdSchema.optional() }).strict().refine(x => x.title !== undefined || x.draft !== undefined || x.preferredAssetId !== undefined, "Supply a change.");
export const jobCreateSchema = z.object({ requestKey: z.string().uuid(), draftRevision: z.number().int().positive() }).strict();
export const emptyDraft = (operation: Operation = "image_to_video"): Draft => operation === "image_to_video"
  ? { operation, prompt: "", presetId: null, parentAssetId: null, startAssetId: null }
  : { operation, prompt: "", presetId: null, parentAssetId: null };

export type ProjectDetail = { project: Project; assets: Asset[]; jobs: Job[] };
export type ListResult<T> = { items: T[]; nextCursor: string | null };
export type Capabilities = {
  liveGeneration: { enabled: boolean; reason: "disabled" | "budget_zero" | "budget_exhausted" | "unavailable" | null; budgetLimitMicroUsd: number; remainingMicroUsd: number };
  operations: Array<{ id: Operation; modelId: string; imageSize?: { width: number; height: number }; count?: number; durationSeconds?: number; referenceRole?: "start_frame" }>;
  upload: { mimeTypes: string[]; maxBytes: number };
  samplesAvailable: boolean;
};
