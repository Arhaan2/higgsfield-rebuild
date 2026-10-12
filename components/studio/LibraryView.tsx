"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ImageIcon, Plus, RefreshCw } from "lucide-react";
import { AppShell, GenerationBadge } from "./AppShell";
import { api, errorMessage, StudioApiError } from "@/src/client/api";
import { clearRecovery } from "@/src/client/recovery";
import { SAMPLE_ASSETS } from "@/src/catalog/samples";
import type { Asset, Job, Project } from "@/src/contracts/studio";
export function LibraryView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [previews, setPreviews] = useState<Record<string, { asset?: Asset; jobs: Job[]; count: number }>>({});
  const [previewFailures, setPreviewFailures] = useState<string[]>([]);
  const [retrying, setRetrying] = useState(false);
  const requestEpoch = useRef(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [guestMissing, setGuestMissing] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const expire = useCallback(() => {
    requestEpoch.current++;
    setGuestMissing(true); clearRecovery(); setProjects([]); setPreviews({});
    setPreviewFailures([]); setCursor(null); setError(""); setLoading(false); setRetrying(false);
  }, []);
  const loadPreviews = useCallback(async (items: Project[], epoch: number) => {
    const results = await Promise.allSettled(items.map(async project => {
      try { return await api.project(project.id); }
      catch (cause) {
        if (requestEpoch.current === epoch && cause instanceof StudioApiError && cause.status === 401) expire();
        throw cause;
      }
    }));
    if (requestEpoch.current !== epoch) return;
    const failed: string[] = [];
    const loaded: Record<string, { asset?: Asset; jobs: Job[]; count: number }> = {};
    results.forEach((result, index) => {
      const project = items[index];
      if (result.status === "rejected" || result.value.project.id !== project.id) { failed.push(project.id); return; }
      const detail = result.value;
      loaded[project.id] = { asset: detail.assets.find(item => item.id === project.preferredAssetId) || detail.assets.at(-1), jobs: detail.jobs, count: detail.assets.filter(item => item.source === "generation").length };
    });
    setPreviews(current => ({ ...current, ...loaded }));
    setPreviewFailures(current => [...current.filter(id => !items.some(item => item.id === id)), ...failed]);
  }, [expire]);
  const load = useCallback(async (next?: string) => {
    const epoch = ++requestEpoch.current;
    setRetrying(false);
    try {
      const result = await api.projects(next);
      if (requestEpoch.current !== epoch) return;
      setError("");
      setProjects(items => next ? [...items, ...result.items] : result.items); setCursor(result.nextCursor); setGuestMissing(false);
      if (!next) {
        setPreviews(current => Object.fromEntries(Object.entries(current).filter(([id]) => result.items.some(item => item.id === id))));
        setPreviewFailures(current => current.filter(id => result.items.some(item => item.id === id)));
      }
      await loadPreviews(result.items, epoch);
    } catch (cause) {
      if (requestEpoch.current !== epoch) return;
      if (cause instanceof StudioApiError && cause.status === 401) expire();
      else setError(errorMessage(cause));
    } finally { if (requestEpoch.current === epoch) setLoading(false); }
  }, [expire, loadPreviews]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { const epoch = requestEpoch; void load(); return () => { epoch.current++; }; }, [load]);
  function reload(next?: string) { setLoading(true); setError(""); void load(next); }
  async function retryPreviews() {
    const epoch = requestEpoch.current;
    setRetrying(true);
    await loadPreviews(projects.filter(project => previewFailures.includes(project.id)), epoch);
    if (requestEpoch.current === epoch) setRetrying(false);
  }
  const sample = SAMPLE_ASSETS[1];
  return <AppShell active="library">
    <header className="page-header"><div><p className="eyebrow">The work you keep</p><h1 className="page-title">Your shots</h1><p className="page-subtitle">Saved in this browser for up to 30 days. Clearing browser cookies removes access.</p></div><div className="header-actions"><GenerationBadge /><a className="button button-primary" href="/studio"><Plus aria-hidden="true" /> New shot</a></div></header>
    {error && <div className="notice notice-error" role="alert"><p>{error}</p><button className="button button-secondary" onClick={() => reload()}><RefreshCw aria-hidden="true" /> Retry library</button></div>}
    {previewFailures.length > 0 && <div className="notice notice-warning" role="status"><p>Preview and request status unavailable for {previewFailures.length === 1 ? "one shot" : `${previewFailures.length} shots`}. You can still open each shot.</p><button className="button button-secondary" disabled={retrying || loading} onClick={() => void retryPreviews()}><RefreshCw aria-hidden="true" />{retrying ? "Retrying previews…" : "Retry previews"}</button></div>}
    {loading && <p className="save-status" role="status">Loading your shots…</p>}
    {!loading && !error && projects.length === 0 && <section className="empty-state"><ImageIcon aria-hidden="true" /><h2>Your next shot starts here.</h2><p>{guestMissing ? "No saved shots are available in this browser session. If your cookie expired or was cleared, previous private shots are no longer accessible." : "Save a prompt or upload a start frame in Studio. Your shot will appear here."}</p><a className="button button-secondary" href="/studio">Open Studio <ArrowRight aria-hidden="true" /></a></section>}
    <div className="library-grid">{projects.map(project => { const preview = previews[project.id]; const unavailable = previewFailures.includes(project.id); const latest = preview?.jobs.at(-1); const thumb = preview?.asset?.posterUrl || (preview?.asset?.kind === "image" ? preview.asset.mediaUrl : null); return <a className="shot-card" href={`/studio?project=${project.id}`} key={project.id}><div className="shot-card-preview">{thumb ? <img src={thumb} alt="" loading="lazy" /> : <ImageIcon aria-hidden="true" />}</div><div className="shot-card-body"><h2 className="shot-card-title">{project.title}</h2><p className="shot-card-meta">{project.draft.operation === "image_to_video" ? "Motion draft" : "Image draft"}{preview && !unavailable && ` · ${preview.count} generated ${preview.count === 1 ? "version" : "versions"}`}</p>{unavailable && <p className="shot-card-meta">Preview and request status unavailable</p>}{latest && !unavailable && <p className="shot-card-meta">Latest request: {latest.status.replaceAll("_", " ")}</p>}<p className="shot-card-meta">Updated <time dateTime={project.updatedAt}>{new Date(project.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time></p></div></a>; })}</div>
    {cursor && <button className="button button-secondary" disabled={loading} onClick={() => reload(cursor)}>Load more shots</button>}
    <section aria-labelledby="collection-title"><div className="section-header"><div><p className="eyebrow">For a little inspiration</p><h2 id="collection-title">Sample collection</h2></div><span className="badge badge-sample">Prepared media</span></div><div className="library-grid"><a className="shot-card" href="/studio?sample=dune-study"><div className="shot-card-preview"><img src={sample.posterUrl!} alt="Aerial view of softly curved desert dunes" width={1920} height={1080} loading="lazy" /></div><div className="shot-card-body"><h3 className="shot-card-title">Dune study</h3><p className="shot-card-meta">One photograph. One independent clip.</p><p className="shot-card-meta">Prepared collection · Not your generated output</p><span className="button button-ghost">Inspect the collection <ArrowRight aria-hidden="true" /></span></div></a></div></section>
  </AppShell>;
}
