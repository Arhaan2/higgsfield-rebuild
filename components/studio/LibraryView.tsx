"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Copy, ImageIcon, Plus, RefreshCw } from "lucide-react";
import { AppShell, GenerationBadge } from "./AppShell";
import { api, errorMessage, StudioApiError } from "@/src/client/api";
import { clearRecovery } from "@/src/client/recovery";
import { clearDuplicateAttempt, createDuplicateAttempt, DuplicateRecoveryError, persistDuplicateAttempt, readDuplicateAttempt, type DuplicateAttempt } from "@/src/client/duplicate-shot";
import { mergeLibraryProjects, preferNewerProject, queryLibraryProjects, type LibraryFilter, type LibrarySort } from "@/src/client/library-query";
import { SAMPLE_ASSETS } from "@/src/catalog/samples";
import type { Asset, Job, Project } from "@/src/contracts/studio";
export function LibraryView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [previews, setPreviews] = useState<Record<string, { asset?: Asset; jobs: Job[]; count: number }>>({});
  const [previewFailures, setPreviewFailures] = useState<string[]>([]);
  const [retrying, setRetrying] = useState(false);
  const requestEpoch = useRef(0);
  const duplicateEpoch = useRef(0);
  const sessionReady = useRef(false);
  const duplicateLock = useRef(false);
  const recoveryChecked = useRef(false);
  const attemptRef = useRef<DuplicateAttempt | null>(null);
  const [duplicateAttempt, setDuplicateAttempt] = useState<DuplicateAttempt | null>(null);
  const [duplicateBusy, setDuplicateBusy] = useState(false);
  const [duplicateError, setDuplicateError] = useState("");
  const [createdCopy, setCreatedCopy] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [guestMissing, setGuestMissing] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const [sort, setSort] = useState<LibrarySort>("updated");
  const searchInput = useRef<HTMLInputElement>(null);
  const expire = useCallback(() => {
    requestEpoch.current++;
    duplicateEpoch.current++; sessionReady.current = false; duplicateLock.current = false;
    attemptRef.current = null; clearDuplicateAttempt();
    setDuplicateAttempt(null); setDuplicateBusy(false); setDuplicateError(""); setCreatedCopy(null);
    setGuestMissing(true); clearRecovery(); setProjects([]); setPreviews({});
    setPreviewFailures([]); setCursor(null); setError(""); setLoading(false); setRetrying(false);
    setSearch(""); setFilter("all"); setSort("updated");
  }, []);
  const loadPreviews = useCallback(async (items: Project[], epoch: number) => {
    const results = await Promise.allSettled(items.map(async project => {
      try {
        const detail = await api.project(project.id);
        if (requestEpoch.current !== epoch || detail.project.id !== project.id) throw new Error("Preview unavailable");
        // A missing thumbnail must not discard a successfully loaded title, prompt, or saved timestamp.
        setProjects(current => current.map(item => item.id === project.id ? preferNewerProject(item, detail.project) : item));
        let asset = detail.assets.find(item => item.id === detail.project.preferredAssetId) || detail.assets.at(-1);
        const draft = detail.project.draft;
        if (!asset && draft.operation === "image_to_video" && draft.startAssetId) {
          asset = SAMPLE_ASSETS.find(item => item.id === draft.startAssetId) || await api.asset(draft.startAssetId);
          if (asset.id !== draft.startAssetId || asset.kind !== "image") throw new Error("Start frame unavailable");
        }
        return { detail, asset };
      }
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
      if (result.status === "rejected") { failed.push(project.id); return; }
      const { detail, asset } = result.value;
      loaded[project.id] = { asset, jobs: detail.jobs, count: detail.assets.filter(item => item.source === "generation").length };
    });
    setPreviews(current => ({ ...current, ...loaded }));
    setPreviewFailures(current => [...current.filter(id => !items.some(item => item.id === id)), ...failed]);
  }, [expire]);
  const load = useCallback(async (next?: string) => {
    const epoch = ++requestEpoch.current;
    sessionReady.current = false;
    setRetrying(false);
    try {
      const result = await api.projects(next);
      if (requestEpoch.current !== epoch) return;
      if (!recoveryChecked.current) {
        recoveryChecked.current = true;
        try { const attempt = readDuplicateAttempt(); attemptRef.current = attempt; setDuplicateAttempt(attempt); }
        catch (cause) { setDuplicateError(errorMessage(cause)); }
      }
      setError("");
      setProjects(items => mergeLibraryProjects(items, result.items, Boolean(next))); setCursor(result.nextCursor); setGuestMissing(false);
      if (!next) {
        setPreviews(current => Object.fromEntries(Object.entries(current).filter(([id]) => result.items.some(item => item.id === id))));
        setPreviewFailures(current => current.filter(id => result.items.some(item => item.id === id)));
      }
      await loadPreviews(result.items, epoch);
      if (requestEpoch.current === epoch) sessionReady.current = true;
    } catch (cause) {
      if (requestEpoch.current !== epoch) return;
      if (cause instanceof StudioApiError && cause.status === 401) expire();
      else setError(errorMessage(cause));
    } finally { if (requestEpoch.current === epoch) setLoading(false); }
  }, [expire, loadPreviews]);
  useEffect(() => {
    const epoch = requestEpoch, copyEpoch = duplicateEpoch, ready = sessionReady;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    return () => { epoch.current++; copyEpoch.current++; ready.current = false; };
  }, [load]);
  function reload(next?: string) { if (duplicateLock.current) return; setLoading(true); setError(""); void load(next); }
  async function duplicateShot(sourceId?: string) {
    // Ref lock closes the interval before React renders a disabled button.
    if (duplicateLock.current || !sessionReady.current || loading) return;
    duplicateLock.current = true; setDuplicateBusy(true); setDuplicateError(""); setCreatedCopy(null);
    const epoch = duplicateEpoch.current;
    let checkingSource = true;
    try {
      let attempt = attemptRef.current ?? readDuplicateAttempt();
      if (attempt) { attemptRef.current = attempt; setDuplicateAttempt(attempt); }
      if (attempt && sourceId && sourceId !== attempt.sourceId) {
        throw new DuplicateRecoveryError("A copy is waiting for confirmation. Retry that saved copy before duplicating another shot.");
      }
      const originalId = attempt?.sourceId ?? sourceId;
      if (!originalId) return;
      // Every retry rechecks ownership with the current cookie. Never rotate guests.
      const source = await api.project(originalId);
      if (duplicateEpoch.current !== epoch) return;
      if (source.project.id !== originalId) throw new Error("The saved source could not be verified. No new copy was sent.");
      if (!attempt) {
        attempt = createDuplicateAttempt(source.project, crypto.randomUUID());
        attemptRef.current = attempt; setDuplicateAttempt(attempt);
      }
      // A source may have changed since the first try. Keep the frozen original payload.
      persistDuplicateAttempt(attempt);
      checkingSource = false;
      const copy = await api.createProject(attempt.payload);
      if (duplicateEpoch.current !== epoch) return;
      if (copy.id !== attempt.payload.id) throw new Error("The copy response could not be confirmed. Retry the saved copy.");
      setCreatedCopy(copy);
      setProjects(items => mergeLibraryProjects(items, [copy], true));
      setPreviews(current => ({ ...current, [copy.id]: { jobs: [], count: 0 } }));
      if (clearDuplicateAttempt(attempt)) { attemptRef.current = null; setDuplicateAttempt(null); }
      else setDuplicateError("Copy created, but its recovery could not be cleared. Finish confirmation before making another copy.");
      void loadPreviews([copy], requestEpoch.current);
    } catch (cause) {
      if (duplicateEpoch.current !== epoch) return;
      if (cause instanceof StudioApiError && cause.status === 401) { expire(); return; }
      if (checkingSource && cause instanceof StudioApiError && cause.status === 404) {
        if (!attemptRef.current || clearDuplicateAttempt(attemptRef.current)) { attemptRef.current = null; setDuplicateAttempt(null); }
        setDuplicateError("The saved source is no longer accessible in this session. No new copy was sent.");
      } else setDuplicateError(cause instanceof DuplicateRecoveryError ? cause.message : `Copy not confirmed. ${errorMessage(cause)}`);
    } finally {
      if (duplicateEpoch.current === epoch) { duplicateLock.current = false; setDuplicateBusy(false); }
    }
  }
  function finishCopyConfirmation() {
    if (!attemptRef.current || !clearDuplicateAttempt(attemptRef.current)) return;
    attemptRef.current = null; setDuplicateAttempt(null); setDuplicateError("");
  }
  async function retryPreviews() {
    const epoch = requestEpoch.current;
    setRetrying(true);
    await loadPreviews(projects.filter(project => previewFailures.includes(project.id)), epoch);
    if (requestEpoch.current === epoch) setRetrying(false);
  }
  function resetView() {
    setSearch(""); setFilter("all"); setSort("updated");
    searchInput.current?.focus();
  }
  const visibleProjects = queryLibraryProjects(projects, search, filter, sort);
  const viewChanged = search !== "" || filter !== "all" || sort !== "updated";
  const sample = SAMPLE_ASSETS[1];
  return <AppShell active="library">
    <header className="page-header"><div><p className="eyebrow">The work you keep</p><h1 className="page-title">Your shots</h1><p className="page-subtitle">Saved in this browser for up to 30 days. Clearing browser cookies removes access.</p></div><div className="header-actions"><GenerationBadge /><a className="button button-primary" href="/studio"><Plus aria-hidden="true" /> New shot</a></div></header>
    {projects.length > 0 && <section className="library-toolbar" aria-label="Find and organize saved shots">
      <div className="library-toolbar-fields">
        <div className="field-group library-search">
          <label className="field-label" htmlFor="library-search">Search saved shots</label>
          <input ref={searchInput} className="text-input" id="library-search" type="search" placeholder="Title or prompt" autoComplete="off" spellCheck={false} value={search} onChange={event => setSearch(event.target.value)} aria-controls="saved-shot-results" />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="library-filter">Draft type</label>
          <select className="text-input" id="library-filter" value={filter} onChange={event => setFilter(event.target.value as LibraryFilter)} aria-controls="saved-shot-results">
            <option value="all">All</option><option value="text_to_image">Image drafts</option><option value="image_to_video">Motion drafts</option>
          </select>
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="library-sort">Sort by</label>
          <select className="text-input" id="library-sort" value={sort} onChange={event => setSort(event.target.value as LibrarySort)} aria-controls="saved-shot-results">
            <option value="updated">Recently updated</option><option value="title">Title A–Z</option>
          </select>
        </div>
      </div>
      <div className="library-summary">
        <p className="field-help" role="status" aria-live="polite" aria-atomic="true">{visibleProjects.length} of {projects.length}{cursor ? " loaded" : ""} {projects.length === 1 ? "shot" : "shots"}</p>
        <button type="button" className="button button-ghost" disabled={!viewChanged} onClick={resetView} aria-label="Reset library view">Reset</button>
      </div>
    </section>}
    {error && <div className="notice notice-error" role="alert"><p>{error}</p><button className="button button-secondary" disabled={duplicateBusy} onClick={() => reload()}><RefreshCw aria-hidden="true" /> Retry library</button></div>}
    {(duplicateBusy || duplicateAttempt || duplicateError || createdCopy) && <section className="notice library-duplicate-notice" aria-label="Saved shot copy">
      <div>
        <p role="status" aria-live="polite" aria-atomic="true">{createdCopy ? "Copy created." : duplicateBusy ? "Confirming your copy…" : duplicateAttempt ? "A saved copy is waiting for confirmation." : "Copy unavailable."}</p>
        {duplicateError && <p role="alert">{duplicateError}</p>}
        {duplicateAttempt && !createdCopy && <p className="field-help">Retry uses the same saved draft from your first attempt, even if the original has changed. Your original stays intact.</p>}
      </div>
      <div className="library-duplicate-actions">
        {createdCopy && <a className="button button-secondary" href={`/studio?project=${createdCopy.id}`}>Open copy <ArrowRight aria-hidden="true" /></a>}
        {duplicateAttempt && (createdCopy ? <button type="button" className="button button-secondary" onClick={finishCopyConfirmation}>Finish confirmation</button> : <button type="button" className="button button-secondary" disabled={duplicateBusy || loading || Boolean(error)} onClick={() => void duplicateShot()}><RefreshCw aria-hidden="true" /> Retry saved copy</button>)}
      </div>
    </section>}
    {previewFailures.length > 0 && <div className="notice notice-warning" role="status"><p>Preview and request status unavailable for {previewFailures.length === 1 ? "one shot" : `${previewFailures.length} shots`}. You can still open each shot.</p><button className="button button-secondary" disabled={retrying || loading} onClick={() => void retryPreviews()}><RefreshCw aria-hidden="true" />{retrying ? "Retrying previews…" : "Retry previews"}</button></div>}
    {loading && <p className="save-status" role="status">Loading your shots…</p>}
    {!loading && !error && projects.length === 0 && !cursor && <section className="empty-state"><ImageIcon aria-hidden="true" /><h2>{guestMissing ? "Your saved session is unavailable." : "Your next shot starts here."}</h2><p>{guestMissing ? "No saved shots are available in this browser session. If your cookie expired or was cleared, previous private shots are no longer accessible." : "Save a prompt or upload a start frame in Studio. Your shot will appear here."}</p><a className="button button-secondary" href="/studio">Open Studio <ArrowRight aria-hidden="true" /></a></section>}
    {!loading && !error && projects.length > 0 && visibleProjects.length === 0 && <section className="empty-state library-no-matches" aria-labelledby="library-no-matches-title">
      <ImageIcon aria-hidden="true" /><h2 id="library-no-matches-title">{cursor ? "No matches in loaded shots." : "No matching shots."}</h2>
      <p>Try another title or prompt, or reset your search and draft filter.{cursor && " More saved shots are available below."}</p>
      <button type="button" className="button button-secondary" onClick={resetView}>Reset search and filters</button>
    </section>}
    <div className="library-grid" id="saved-shot-results">{visibleProjects.map(project => {
      const preview = previews[project.id];
      const unavailable = previewFailures.includes(project.id);
      const latest = preview?.jobs.at(-1);
      const thumb = preview?.asset?.posterUrl || (preview?.asset?.kind === "image" ? preview.asset.mediaUrl : null);
      return <div className="library-shot-item" key={project.id}>
        <a className="shot-card" href={`/studio?project=${project.id}`} onClick={event => { if (event.detail > 1) event.preventDefault(); }}>
          <div className="shot-card-preview">{thumb ? <img src={thumb} alt="" loading="lazy" /> : <ImageIcon aria-hidden="true" />}</div>
          <div className="shot-card-body">
            <h2 className="shot-card-title">{project.title}</h2>
            <p className="shot-card-meta">{project.draft.operation === "image_to_video" ? "Motion draft" : "Image draft"}{preview && !unavailable && ` · ${preview.count} generated ${preview.count === 1 ? "version" : "versions"}`}</p>
            {unavailable && <p className="shot-card-meta">Preview and request status unavailable</p>}
            {latest && !unavailable && <p className="shot-card-meta">Latest request: {latest.status.replaceAll("_", " ")}</p>}
            <p className="shot-card-meta">Updated <time dateTime={project.updatedAt}>{new Date(project.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time></p>
          </div>
        </a>
        <div className="library-shot-actions">
          <button type="button" className="button button-secondary" disabled={loading || duplicateBusy || Boolean(duplicateAttempt) || Boolean(error)} onClick={event => { if (event.detail <= 1) void duplicateShot(project.id); }} aria-label={`Duplicate saved shot: ${project.title}`}><Copy aria-hidden="true" /> Duplicate saved shot</button>
        </div>
      </div>;
    })}</div>
    {cursor && <div className="library-pagination"><p className="field-help">Search and sort cover the {projects.length} {projects.length === 1 ? "shot" : "shots"} loaded so far. Load more to include remaining saved shots.</p><button type="button" className="button button-secondary" disabled={loading || duplicateBusy} onClick={() => reload(cursor)}>Load more shots</button></div>}
    <section aria-labelledby="collection-title"><div className="section-header"><div><p className="eyebrow">For a little inspiration</p><h2 id="collection-title">Sample collection</h2></div><span className="badge badge-sample">Prepared media</span></div><div className="library-grid"><a className="shot-card" href="/studio?sample=dune-study"><div className="shot-card-preview"><img src={sample.posterUrl!} alt="Aerial view of softly curved desert dunes" width={1920} height={1080} loading="lazy" /></div><div className="shot-card-body"><h3 className="shot-card-title">Dune study</h3><p className="shot-card-meta">One photograph. One independent clip.</p><p className="shot-card-meta">Prepared collection · Not your generated output</p><span className="button button-ghost">Inspect the collection <ArrowRight aria-hidden="true" /></span></div></a></div></section>
  </AppShell>;
}
