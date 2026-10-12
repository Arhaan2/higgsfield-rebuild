"use client";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, ImageIcon, Plus, RefreshCw } from "lucide-react";
import { AppShell, GenerationBadge } from "./AppShell";
import { api, errorMessage, StudioApiError } from "@/src/client/api";
import { clearRecovery } from "@/src/client/recovery";
import { SAMPLE_ASSETS } from "@/src/catalog/samples";
import type { Asset, Job, Project } from "@/src/contracts/studio";
export function LibraryView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [previews, setPreviews] = useState<Record<string, { asset?: Asset; jobs: Job[]; count: number }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [guestMissing, setGuestMissing] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const load = useCallback(async (next?: string) => {
    try {
      const result = await api.projects(next);
      setError("");
      setProjects(items => next ? [...items, ...result.items] : result.items); setCursor(result.nextCursor); setGuestMissing(false);
      await Promise.allSettled(result.items.map(async project => {
        const detail = await api.project(project.id);
        const asset = detail.assets.find(item => item.id === project.preferredAssetId) || detail.assets.at(-1);
        setPreviews(current => ({ ...current, [project.id]: { asset, jobs: detail.jobs, count: detail.assets.filter(item => item.source === "generation").length } }));
      }));
    } catch (cause) {
      if (cause instanceof StudioApiError && cause.status === 401) { setGuestMissing(true); clearRecovery(); setProjects([]); }
      else setError(errorMessage(cause));
    } finally { setLoading(false); }
  }, []);
  // All state updates in load follow the guest API response; initial loading is already true.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  function reload(next?: string) { setLoading(true); setError(""); void load(next); }
  const sample = SAMPLE_ASSETS[1];
  return <AppShell active="library">
    <header className="page-header"><div><p className="eyebrow">The work you keep</p><h1 className="page-title">Your shots</h1><p className="page-subtitle">Saved in this browser for up to 30 days. Clearing browser cookies removes access.</p></div><div className="header-actions"><GenerationBadge /><a className="button button-primary" href="/studio"><Plus aria-hidden="true" /> New shot</a></div></header>
    {error && <div className="notice notice-error" role="alert"><p>{error}</p><button className="button button-secondary" onClick={() => reload()}><RefreshCw aria-hidden="true" /> Retry library</button></div>}
    {loading && <p className="save-status" role="status">Loading your shots…</p>}
    {!loading && !error && projects.length === 0 && <section className="empty-state"><ImageIcon aria-hidden="true" /><h2>Your next shot starts here.</h2><p>{guestMissing ? "No saved shots are available in this browser session. If your cookie expired or was cleared, previous private shots are no longer accessible." : "Save a prompt or upload a start frame in Studio. Your shot will appear here."}</p><a className="button button-secondary" href="/studio">Open Studio <ArrowRight aria-hidden="true" /></a></section>}
    <div className="library-grid">{projects.map(project => { const preview = previews[project.id]; const latest = preview?.jobs.at(-1); const thumb = preview?.asset?.posterUrl || (preview?.asset?.kind === "image" ? preview.asset.mediaUrl : null); return <a className="shot-card" href={`/studio?project=${project.id}`} key={project.id}><div className="shot-card-preview">{thumb ? <img src={thumb} alt="" loading="lazy" /> : <ImageIcon aria-hidden="true" />}</div><div className="shot-card-body"><h2 className="shot-card-title">{project.title}</h2><p className="shot-card-meta">{project.draft.operation === "image_to_video" ? "Motion draft" : "Image draft"}{preview && ` · ${preview.count} generated ${preview.count === 1 ? "version" : "versions"}`}</p>{latest && <p className="shot-card-meta">Latest request: {latest.status.replaceAll("_", " ")}</p>}<p className="shot-card-meta">Updated <time dateTime={project.updatedAt}>{new Date(project.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time></p></div></a>; })}</div>
    {cursor && <button className="button button-secondary" disabled={loading} onClick={() => reload(cursor)}>Load more shots</button>}
    <section aria-labelledby="collection-title"><div className="section-header"><div><p className="eyebrow">For a little inspiration</p><h2 id="collection-title">Sample collection</h2></div><span className="badge badge-sample">Prepared media</span></div><div className="library-grid"><a className="shot-card" href="/studio?sample=dune-study"><div className="shot-card-preview"><img src={sample.posterUrl!} alt="Aerial view of softly curved desert dunes" width={1920} height={1080} loading="lazy" /></div><div className="shot-card-body"><h3 className="shot-card-title">Dune study</h3><p className="shot-card-meta">One photograph. One independent clip.</p><p className="shot-card-meta">Prepared collection · Not your generated output</p><span className="button button-ghost">Inspect the collection <ArrowRight aria-hidden="true" /></span></div></a></div></section>
  </AppShell>;
}
