"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, errorMessage, StudioApiError } from "./api";
import { clearRecovery, freshBuffer, readRecovery, rememberSession, removeRecovery, signature, writeRecovery, type EditorBuffer, type PendingSubmission } from "./recovery";
import { PRESETS, SAMPLE_ASSETS } from "@/src/catalog/samples";
import { UPLOAD_LIMIT, type Asset, type Capabilities, type Draft, type Job, type Operation, type Project } from "@/src/contracts/studio";

export const activeJob = (job: Job) => ["prepared", "submitting", "submission_unknown", "queued", "running", "storing", "transfer_failed"].includes(job.status);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const acknowledgedSignature = (project: Project) => signature({ ...freshBuffer(), title: project.title, operation: project.draft.operation, drafts: { ...freshBuffer().drafts, [project.draft.operation]: project.draft } });

export function useStudio() {
  const [buffer, setBuffer] = useState<EditorBuffer>(freshBuffer);
  const bufferRef = useRef(buffer);
  const [project, setProject] = useState<Project | null>(null);
  const projectRef = useRef<Project | null>(null);
  const [acknowledged, setAcknowledged] = useState<string | null>(null);
  const ackRef = useRef<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sampleCollection, setSampleCollection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [conflict, setConflict] = useState(false);
  const conflictRef = useRef(false);
  const [expired, setExpired] = useState(false);
  const expiredRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const uploadingRef = useRef(false);
  const [uploadError, setUploadError] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const uploadAttempt = useRef<{ id: string; file: File } | null>(null);
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [capabilityError, setCapabilityError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pending, setPending] = useState<PendingSubmission | null>(null);
  const pendingRef = useRef<PendingSubmission | null>(null);
  const [jobError, setJobError] = useState("");
  const [jobBusy, setJobBusy] = useState<string | null>(null);
  const jobRequests = useRef(new Set<string>());
  const pollAfter = useRef(new Map<string, number>());
  const submittingRef = useRef(false);
  const keyRef = useRef("new");
  const savingPromise = useRef<Promise<Project | null> | null>(null);
  const createAttempt = useRef<{ id: string; title: string; draft: Draft } | null>(null);
  const loadedRef = useRef(false);
  const loadFailedRef = useRef(false);
  const recoveryWarning = useRef(false);

  const persist = useCallback(() => {
    if (expiredRef.current || !loadedRef.current) return false;
    const ok = writeRecovery(keyRef.current, { buffer: bufferRef.current, revision: projectRef.current?.revision ?? null, acknowledged: ackRef.current, pending: pendingRef.current, creation: createAttempt.current });
    if (!ok && !recoveryWarning.current) { recoveryWarning.current = true; setNotice("Browser recovery storage is unavailable. Save your draft before closing this page."); }
    return ok;
  }, []);
  const edit = useCallback((update: (current: EditorBuffer) => EditorBuffer) => {
    const next = update(bufferRef.current); bufferRef.current = next; setBuffer(next); persist();
  }, [persist]);
  const acceptProject = useCallback((value: Project) => {
    projectRef.current = value; setProject(value);
    ackRef.current = acknowledgedSignature(value); setAcknowledged(ackRef.current);
  }, []);
  const handleError = useCallback((cause: unknown) => {
    if (cause instanceof StudioApiError && cause.status === 401) {
      expiredRef.current = true; setExpired(true); clearRecovery();
      setError("Your browser session has expired or is unavailable. Your current text is still here, but private media and saved shots need the original session.");
    } else if (cause instanceof StudioApiError && cause.code === "REVISION_CONFLICT") {
      conflictRef.current = true; setConflict(true); setError("This shot changed in another tab. Your current edits have been kept. Save them as a separate shot to preserve both drafts.");
    } else setError(errorMessage(cause));
  }, []);

  const save = useCallback(async (): Promise<Project | null> => {
    if (savingPromise.current) return savingPromise.current;
    if (expiredRef.current || conflictRef.current) return null;
    const operation = async () => {
      setSaving(true); setError("");
      const current = bufferRef.current;
      const draft = current.drafts[current.operation];
      if (!current.title.trim()) { setError("Give your shot a title before saving."); setSaving(false); return null; }
      if ([...draft.prompt].length > 2500) { setError("Keep your prompt within 2,500 characters."); setSaving(false); return null; }
      try {
        let saved = projectRef.current;
        if (!saved) {
          const guest = await api.guest(); rememberSession(guest.expiresAt);
          createAttempt.current ||= { id: crypto.randomUUID(), title: current.title.trim(), draft: { ...draft } };
          persist();
          saved = await api.createProject(createAttempt.current);
          const previousKey = keyRef.current;
          keyRef.current = saved.id; acceptProject(saved);
          persist(); removeRecovery(previousKey);
          window.history.replaceState(null, "", `/studio?project=${saved.id}`);
          createAttempt.current = null;
        }
        if (acknowledgedSignature(saved) !== signature(current)) {
          saved = await api.saveProject(saved.id, { expectedRevision: saved.revision, title: current.title.trim(), draft });
          acceptProject(saved);
        }
        persist(); return saved;
      } catch (cause) { handleError(cause); persist(); return null; }
      finally { setSaving(false); }
    };
    const promise = operation(); savingPromise.current = promise;
    try { return await promise; } finally { savingPromise.current = null; }
  }, [acceptProject, handleError, persist]);

  const hasWork = useCallback(() => {
    const value = bufferRef.current;
    return !!projectRef.current || value.title !== "Untitled shot" || Object.values(value.drafts).some(draft => !!draft.prompt || (draft.operation === "image_to_video" && !!draft.startAssetId));
  }, []);
  const beforeNavigate = useCallback(async () => {
    if (loadFailedRef.current) return true;
    if (uploadingRef.current) { setError("Wait for the start-frame upload to finish before leaving this shot."); return false; }
    if (!hasWork()) return true;
    // Save the current snapshot; if typing continued during the request, acknowledge that newer snapshot too.
    for (let attempt = 0; attempt < 5; attempt++) {
      if (projectRef.current && signature(bufferRef.current) === ackRef.current) return true;
      if (!await save()) return false;
    }
    setError("Your newest edits are still unsaved. Pause typing, then save before leaving."); return false;
  }, [hasWork, save]);

  useEffect(() => {
    let alive = true;
    const query = new URLSearchParams(window.location.search);
    const projectId = query.get("project"); const sampleId = query.get("sample"); const presetId = query.get("preset");
    keyRef.current = projectId || (presetId ? `preset:${presetId}` : sampleId ? `sample:${sampleId}` : "new");
    async function initialize() {
      const recovery = readRecovery(keyRef.current);
      if (recovery?.creation) createAttempt.current = recovery.creation;
      try {
        if (projectId) {
          if (!uuid.test(projectId)) throw new Error("That shot link is not valid. Open a shot from Library or start a new one.");
          if (recovery && alive) { bufferRef.current = recovery.buffer; setBuffer(recovery.buffer); }
          const detail = await api.project(projectId);
          if (!alive) return;
          detail.assets.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
          detail.jobs.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
          acceptProject(detail.project); setAssets(detail.assets); setJobs(detail.jobs);
          setSelectedId(detail.project.preferredAssetId || detail.assets.at(-1)?.id || null);
          const next = recovery?.buffer || freshBuffer();
          const localDirty = !!recovery && signature(recovery.buffer) !== recovery.acknowledged;
          if (!localDirty) { next.title = detail.project.title; next.operation = detail.project.draft.operation; next.drafts = { ...next.drafts, [detail.project.draft.operation]: detail.project.draft }; }
          else if (recovery.revision !== detail.project.revision) { conflictRef.current = true; setConflict(true); setError("The saved shot changed while this browser had unsaved edits. Your edits are preserved; save a separate shot to keep both."); }
          bufferRef.current = next; setBuffer(next);
          if (recovery?.pending && !detail.jobs.some(job => job.requestKey === recovery.pending?.requestKey)) { pendingRef.current = recovery.pending; setPending(recovery.pending); }
          setNotice(localDirty ? "Unsaved browser buffer restored. Save it to keep your latest changes." : "Saved draft restored. The other task’s draft stays in this browser.");
        } else {
          if (sampleId && sampleId !== "dune-study") throw new Error("That sample is not available. Open the Dune study from Explore.");
          const preset = presetId ? PRESETS.find(item => item.id === presetId) : null;
          if (presetId && !preset) throw new Error("That prompt is not available. Choose one of the three prompts in Explore.");
          let next = recovery?.buffer || freshBuffer();
          if (preset && !recovery) next = { ...next, title: preset.title, operation: preset.operation, drafts: { ...next.drafts, [preset.operation]: { ...preset.draft } } };
          if (!alive) return;
          bufferRef.current = next; setBuffer(next);
          if (recovery) setNotice("Unsaved browser buffer restored. It is not a confirmed server save.");
          if (sampleId) { setSampleCollection(true); setSelectedId(SAMPLE_ASSETS[0].id); }
        }
        if (!alive) return;
        loadedRef.current = true; setLoading(false); persist();
        if (presetId && !projectId) { setNotice("Prompt added to a new draft. No generation has been requested."); await save(); }
      } catch (cause) {
        if (!alive) return;
        loadedRef.current = true; setLoading(false);
        if (cause instanceof StudioApiError && cause.status === 401) handleError(cause);
        else { loadFailedRef.current = true; setLoadError(errorMessage(cause)); }
      }
    }
    void initialize();
    void api.capabilities().then(value => { if (alive) setCapabilities(value); }).catch(cause => { if (alive) setCapabilityError(errorMessage(cause)); });
    return () => { alive = false; };
  }, [acceptProject, handleError, persist, save]);

  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if ((hasWork() && signature(bufferRef.current) !== ackRef.current) || uploadingRef.current) { event.preventDefault(); event.returnValue = ""; }
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [hasWork]);

  const referenceId = buffer.drafts.image_to_video.operation === "image_to_video" ? buffer.drafts.image_to_video.startAssetId : null;
  useEffect(() => {
    if (!referenceId || assets.some(asset => asset.id === referenceId) || SAMPLE_ASSETS.some(asset => asset.id === referenceId)) return;
    let alive = true;
    void api.asset(referenceId).then(asset => { if (alive) setAssets(current => [...current.filter(item => item.id !== asset.id), asset]); }).catch(() => { if (alive) setUploadError("Start frame unavailable — choose it again. Your prompt is preserved."); });
    return () => { alive = false; };
  }, [referenceId, assets]);

  async function upload(file: File) {
    if (uploadingRef.current || expiredRef.current || conflictRef.current) return;
    setUploadError(""); setPendingFile(file);
    if (!["image/jpeg", "image/png"].includes(file.type) || !/\.(jpe?g|png)$/i.test(file.name)) { setUploadError("Choose a JPG or PNG image. Your previous start frame is unchanged."); return; }
    if (file.size > (capabilities?.upload.maxBytes ?? UPLOAD_LIMIT)) { setUploadError("Choose an image under 5 MB. Your previous start frame is unchanged."); return; }
    uploadingRef.current = true; setUploading(true);
    try {
      const bitmap = await createImageBitmap(file).catch(() => { throw new Error("This image could not be opened. Choose a valid JPG or PNG."); });
      const valid = bitmap.width >= 256 && bitmap.height >= 256 && bitmap.width <= 4096 && bitmap.height <= 4096 && bitmap.width * bitmap.height <= 16_000_000;
      bitmap.close();
      if (!valid) throw new Error("Use an image from 256 to 4,096 pixels on each side, up to 16 megapixels.");
      const saved = await save(); if (!saved) { setUploadError("The draft must be saved before upload. Resolve the save error above, then try this upload again."); return; }
      if (uploadAttempt.current?.file !== file) uploadAttempt.current = { id: crypto.randomUUID(), file };
      const asset = await api.upload(saved.id, uploadAttempt.current.id, file);
      setAssets(current => [...current.filter(item => item.id !== asset.id), asset]); setSelectedId(asset.id);
      edit(current => ({ ...current, operation: "image_to_video", drafts: { ...current.drafts, image_to_video: { ...current.drafts.image_to_video, operation: "image_to_video", startAssetId: asset.id } } }));
      setPendingFile(null); uploadAttempt.current = null;
      await save();
    } catch (cause) { setUploadError(errorMessage(cause)); if (cause instanceof StudioApiError && cause.status === 401) handleError(cause); }
    finally { uploadingRef.current = false; setUploading(false); }
  }
  function switchMode(operation: Operation) { edit(current => ({ ...current, operation })); }
  function updatePrompt(prompt: string) { edit(current => ({ ...current, drafts: { ...current.drafts, [current.operation]: { ...current.drafts[current.operation], prompt } } })); }
  async function forkDraft(draft: Draft) {
    if (!await beforeNavigate()) return;
    edit(current => ({ ...current, operation: draft.operation, drafts: { ...current.drafts, [draft.operation]: draft } }));
    setNotice("Ready to revise. The original asset and its prompt are unchanged.");
    await save();
  }
  async function saveSeparate() {
    projectRef.current = null; setProject(null); ackRef.current = null; setAcknowledged(null); createAttempt.current = null;
    conflictRef.current = false; setConflict(false); pendingRef.current = null; setPending(null);
    keyRef.current = "new"; window.history.replaceState(null, "", "/studio");
    setAssets([]); setJobs([]); setSelectedId(null);
    edit(current => ({ ...current, title: `${current.title.slice(0, 73)} (copy)` }));
    await save();
  }
  async function restartSession() {
    clearRecovery(); expiredRef.current = false; setExpired(false); conflictRef.current = false; setConflict(false);
    projectRef.current = null; setProject(null); ackRef.current = null; setAcknowledged(null); createAttempt.current = null;
    pendingRef.current = null; setPending(null); setAssets([]); setJobs([]); setSelectedId(null); keyRef.current = "new";
    window.history.replaceState(null, "", "/studio");
    edit(current => ({ ...current, drafts: Object.fromEntries(Object.entries(current.drafts).map(([mode, draft]) => [mode, { ...draft, parentAssetId: draft.parentAssetId?.startsWith("sample-") ? draft.parentAssetId : null, ...(draft.operation === "image_to_video" ? { startAssetId: draft.startAssetId?.startsWith("sample-") ? draft.startAssetId : null } : {}) }])) as EditorBuffer["drafts"] }));
    setNotice("Your text is kept in a new draft. Private start frames from the previous session must be uploaded again."); await save();
  }
  async function refreshJob(job: Job, transfer = false) {
    if (jobRequests.current.has(job.id)) return;
    jobRequests.current.add(job.id);
    setJobBusy(job.id); setJobError("");
    try {
      const next = await (transfer ? api.retryTransfer(job.id) : api.refresh(job.id));
      pollAfter.current.set(next.id, next.nextPollAfterMs || 0);
      setJobs(current => current.map(item => item.id === next.id ? next : item));
      if (next.status === "succeeded") {
        const detail = await api.project(next.projectId); setAssets(detail.assets.sort((a, b) => a.createdAt.localeCompare(b.createdAt))); setJobs(detail.jobs.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
        setSelectedId(next.outputAssetIds[0] || null); setNotice("Your result is ready to inspect.");
      }
    } catch (cause) { setJobError(`Status could not be refreshed. The last confirmed state is unchanged. ${errorMessage(cause)}`); }
    finally { jobRequests.current.delete(job.id); setJobBusy(null); }
  }
  useEffect(() => {
    const job = jobs.find(item => activeJob(item) && item.status !== "transfer_failed" && (item.status !== "submission_unknown" || item.error?.recovery === "refresh"));
    if (!job) return;
    let stopped = false; let timer: ReturnType<typeof setTimeout>; let attempt = 0;
    const schedule = () => { timer = setTimeout(tick, Math.max(pollAfter.current.get(job.id) ?? job.nextPollAfterMs ?? 0, [3000, 5000, 10000, 15000][Math.min(attempt, 3)]) + Math.random() * 400); };
    const tick = async () => {
      if (stopped) return;
      if (!document.hidden) { await refreshJob(job); attempt++; }
      if (!stopped) schedule();
    };
    schedule(); return () => { stopped = true; clearTimeout(timer); };
    // Reconcile only the persisted job; no refresh path can create a replacement request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs.map(job => `${job.id}:${job.status}`).join("|")]);
  async function submit() {
    if (submittingRef.current || expiredRef.current) return;
    if (!pendingRef.current && (!capabilities?.liveGeneration.enabled || capabilities.liveGeneration.remainingMicroUsd <= 0)) return;
    if (!pendingRef.current && jobs.some(activeJob)) return;
    submittingRef.current = true; setSubmitting(true); setJobError("");
    try {
      if (!pendingRef.current) {
        if (!await beforeNavigate()) return;
        const saved = projectRef.current; if (!saved) return;
        pendingRef.current = { projectId: saved.id, requestKey: crypto.randomUUID(), draftRevision: saved.revision };
        setPending(pendingRef.current); persist();
      }
      const request = pendingRef.current;
      if (!persist()) throw new Error("Browser recovery storage is unavailable. The request has not been sent; enable browser storage before trying again.");
      const job = await api.submit(request.projectId, { requestKey: request.requestKey, draftRevision: request.draftRevision });
      setJobs(current => [...current.filter(item => item.id !== job.id), job]); pendingRef.current = null; setPending(null); persist();
    } catch (cause) {
      if (cause instanceof StudioApiError && cause.status >= 400 && cause.status < 500 && !["INVALID_RESPONSE", "REQUEST_KEY_CONFLICT"].includes(cause.code)) { pendingRef.current = null; setPending(null); persist(); }
      setJobError(errorMessage(cause));
    } finally { submittingRef.current = false; setSubmitting(false); }
  }
  return { buffer, project, assets, jobs, selectedId, setSelectedId, sampleCollection, loading, loadError, error, notice, conflict, expired, saving, uploading, uploadError, pendingFile, capabilities, capabilityError, submitting, pending, jobError, jobBusy,
    dirty: (!!project || buffer.title !== "Untitled shot" || Object.values(buffer.drafts).some(item => !!item.prompt || (item.operation === "image_to_video" && !!item.startAssetId))) && signature(buffer) !== acknowledged, saved: !!project && signature(buffer) === acknowledged,
    edit, save, beforeNavigate, upload, switchMode, updatePrompt, forkDraft, saveSeparate, restartSession, refreshJob, submit,
    removeReference: () => edit(current => ({ ...current, drafts: { ...current.drafts, image_to_video: { ...current.drafts.image_to_video, operation: "image_to_video", startAssetId: null } } })),
    retryCapabilities: async () => { try { setCapabilities(await api.capabilities()); setCapabilityError(""); } catch (cause) { setCapabilityError(errorMessage(cause)); } },
  };
}
