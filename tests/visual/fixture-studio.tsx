import { createContext, useContext, useState, type ReactNode } from "react";
import type { useStudio as productionUseStudio } from "../../src/client/use-studio";
import type { Asset, Job, JobStatus } from "../../src/contracts/studio";
import { emptyDraft, IMAGE_MODEL, IMAGE_SETTINGS, VIDEO_MODEL, VIDEO_SETTINGS, UPLOAD_LIMIT } from "../../src/contracts/studio";
import { PRESETS, SAMPLE_ASSETS, SAMPLE_HASHES } from "../../src/catalog/samples";

type StudioState = ReturnType<typeof productionUseStudio>;
export const scenarios = ["empty_draft", "uploaded_reference", "validation_error", "submitting", "queued", "running", "submission_unknown", "pending_acknowledgement", "succeeded", "failed", "transfer_failed", "budget_exhausted", "restored_iteration", "library_partial_failure", "cross_project_reference", "metadata_unavailable"] as const;
export type Scenario = typeof scenarios[number];
export const fixtureLabel = "ISOLATED UI TEST — NO GENERATION OR SAVING";
const timestamp = "2026-10-12T01:35:00Z";
const projectId = "00000000-0000-4000-8000-000000000001";
const requestKey = "00000000-0000-4000-8000-000000000002";
const jobId = "00000000-0000-4000-8000-000000000003";

// Source discriminants exercise production branches. Pixels and attribution remain
// the committed samples; the harness and every dialog carry persistent disclosures.
export const fixtureReference: Asset = {
  ...SAMPLE_ASSETS[0], id: "fixture-reference", projectId, source: "upload",
  title: "FIXTURE reference — Jacob Castle / Unsplash sample",
};
export const fixtureOutput: Asset = {
  ...SAMPLE_ASSETS[1], id: "fixture-output", projectId, source: "generation", sourceJobId: jobId,
  title: "FIXTURE result — Lukas Rodriguez / Pexels sample (not generated)",
};
export const fixtureExternalImage: Asset = { ...SAMPLE_ASSETS[0], id: "fixture-external-image", projectId: "fixture-source-project", source: "generation", sourceJobId: "fixture-image-job", title: "FIXTURE external image — prepared pixels, not generated" };
const fixtureSourceJob: Job = {
  id: "fixture-image-job", projectId: "fixture-source-project", requestKey, status: "succeeded",
  snapshot: { schemaVersion: 1, provider: "fal", operation: "text_to_image", modelId: IMAGE_MODEL, parentAssetId: null, prompt: "FIXTURE immutable original image prompt — warm light on dunes", presetId: null, presetVersion: null, startAsset: null, settings: IMAGE_SETTINGS },
  outputAssetIds: [fixtureExternalImage.id], resultMetadata: { seed: 123, width: 1600, height: 2397, durationSeconds: null }, error: null, nextPollAfterMs: null, lastCheckedAt: null, createdAt: timestamp, updatedAt: timestamp,
};
export const fixtureAssets = [fixtureReference, fixtureOutput, fixtureExternalImage, ...SAMPLE_ASSETS];
export const activeJob = (job: Job) => (["prepared", "submitting", "submission_unknown", "queued", "running", "storing", "transfer_failed"] as JobStatus[]).includes(job.status);
const Context = createContext<StudioState | null>(null);
export function useStudio(): StudioState {
  const state = useContext(Context);
  if (!state) throw new Error("Isolated fixture provider required");
  return state;
}

export function FixtureProvider({ scenario, report, children }: { scenario: Scenario; report: (message: string) => void; children: ReactNode }) {
  const hasOutput = scenario === "succeeded" || scenario === "restored_iteration";
  const hasReference = scenario !== "empty_draft";
  const external = scenario === "cross_project_reference" || scenario === "metadata_unavailable";
  const reference = external ? fixtureExternalImage : fixtureReference;
  const [selectedId, setSelectedId] = useState<string | null>(hasOutput ? fixtureOutput.id : hasReference ? reference.id : null);
  const blocked = () => report("Read-only fixture: action ignored. No request, upload, save, retry, or revision occurred. Select a scenario above.");
  const videoDraft = { ...emptyDraft("image_to_video"), operation: "image_to_video" as const, startAssetId: hasReference ? reference.id : null,
    prompt: scenario === "empty_draft" ? "" : scenario === "validation_error" ? "A".repeat(2501) : PRESETS[1].draft.prompt,
    parentAssetId: scenario === "restored_iteration" ? fixtureOutput.id : null };
  const status: JobStatus | null = hasOutput ? "succeeded" : (["submitting", "queued", "running", "submission_unknown", "failed", "transfer_failed"] as string[]).includes(scenario) ? scenario as JobStatus : null;
  const job: Job | null = status ? {
    id: jobId, projectId, requestKey, status,
    snapshot: { schemaVersion: 1, provider: "fal", operation: "image_to_video", modelId: VIDEO_MODEL,
      parentAssetId: fixtureReference.id, prompt: PRESETS[1].draft.prompt, presetId: null, presetVersion: null,
      startAsset: { id: fixtureReference.id, sha256: SAMPLE_HASHES["sample-dune-light"], mimeType: "image/jpeg" }, settings: VIDEO_SETTINGS },
    outputAssetIds: hasOutput ? [fixtureOutput.id] : [],
    resultMetadata: hasOutput ? { seed: null, width: fixtureOutput.width, height: fixtureOutput.height, durationSeconds: fixtureOutput.durationSeconds } : null,
    error: status === "failed" ? { code: "FIXTURE_FAILED", message: "Fixture failure: this version could not be created. Your prompt and reference are preserved.", recovery: "revise" }
      : status === "transfer_failed" ? { code: "FIXTURE_TRANSFER_FAILED", message: "Fixture transfer failure; no transfer was attempted.", recovery: "retry_transfer" }
      : status === "submission_unknown" ? { code: "FIXTURE_UNKNOWN", message: "Fixture uncertain outcome; no request was submitted.", recovery: "contact_owner" } : null,
    nextPollAfterMs: null, lastCheckedAt: null, createdAt: timestamp, updatedAt: timestamp,
  } : null;
  const state: StudioState = {
    buffer: { title: scenario === "empty_draft" ? "Untitled shot" : `Fixture: ${scenario.replaceAll("_", " ")}`, operation: "image_to_video", drafts: { image_to_video: videoDraft, text_to_image: emptyDraft("text_to_image") } },
    project: null, assets: hasOutput ? [fixtureReference, fixtureOutput] : hasReference ? [reference] : [], jobs: job ? [job] : [], sourceJobs: scenario === "cross_project_reference" ? [fixtureSourceJob] : [],
    selectedId, setSelectedId, sampleCollection: false, loading: false, loadError: "",
    error: scenario === "validation_error" ? "Keep your prompt within 2,500 characters." : "",
    notice: scenario === "restored_iteration" ? "Fixture restored iteration: unsaved browser buffer restored. It is not a confirmed server save. No recovery storage was read." : "",
    conflict: false, expired: false, saving: false, saved: false, dirty: scenario !== "empty_draft",
    uploading: false, uploadError: "", pendingFile: null,
    capabilities: { liveGeneration: { enabled: false, reason: scenario === "budget_exhausted" ? "budget_exhausted" : "budget_zero", budgetLimitMicroUsd: 0, remainingMicroUsd: 0 }, operations: [{ id: "image_to_video", modelId: VIDEO_MODEL, durationSeconds: 5, referenceRole: "start_frame" }], upload: { mimeTypes: ["image/jpeg", "image/png"], maxBytes: UPLOAD_LIMIT }, samplesAvailable: true },
    capabilityError: "", submitting: scenario === "submitting",
    pending: scenario === "pending_acknowledgement" ? { projectId, requestKey, draftRevision: 1 } : null,
    jobError: scenario === "budget_exhausted" ? "Fixture: the generation allowance has been reached. No provider was contacted." : "", jobBusy: null,
    edit: blocked, updatePrompt: blocked, switchMode: blocked, removeReference: blocked,
    save: async () => { blocked(); return null; }, beforeNavigate: async () => { blocked(); return false; },
    upload: async () => blocked(), forkDraft: async () => blocked(), saveSeparate: async () => blocked(),
    restartSession: async () => blocked(), refreshJob: async () => blocked(), submit: async () => blocked(), retryCapabilities: async () => blocked(),
  };
  return <Context.Provider value={state}>{children}</Context.Provider>;
}
