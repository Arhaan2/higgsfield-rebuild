"use client";
import { useEffect, useRef, useState } from "react";
import { Download, X } from "lucide-react";
import type { Asset, Job } from "@/src/contracts/studio";
import { AssetMedia, Attribution, mediaFacts } from "./AssetMedia";
import { api } from "@/src/client/api";
export function AssetDetails({ asset, job, suggestedPrompt, parent, onClose, onParent, onReuse }: { asset: Asset; job?: Job; suggestedPrompt?: string; parent?: Asset; onClose: () => void; onParent: (asset: Asset) => void; onReuse: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [startFrame, setStartFrame] = useState<Asset | null>(null);
  const startId = job?.snapshot.startAsset?.id;
  useEffect(() => {
    if (!startId) return;
    let alive = true;
    void api.asset(startId).then(value => { if (alive) setStartFrame(value); }).catch(() => { /* Keep immutable metadata available if its media cannot load. */ });
    return () => { alive = false; };
  }, [startId]);
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const element = dialog.current;
    element?.showModal();
    return () => { element?.close(); previous?.focus(); };
  }, []);
  return <dialog className="asset-dialog" ref={dialog} aria-labelledby="asset-detail-title" onClose={onClose} onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose(); } }}>
    <header className="dialog-header"><div><p className="eyebrow">{asset.source === "sample" ? "Prepared media" : asset.source === "upload" ? "Your reference" : "Version details"}</p><h2 id="asset-detail-title">{asset.title}</h2></div><button className="button button-icon dialog-close" onClick={onClose} aria-label="Close asset details" autoFocus><X aria-hidden="true" /></button></header>
    <div className="dialog-body"><AssetMedia key={asset.id} asset={asset} />
      <p className="media-caption">{asset.source === "sample" ? "Prepared sample · not generated from this draft" : asset.source === "upload" ? "Uploaded start frame · original retained" : "Generated result · original prompt retained"}</p>
      {asset.source === "sample" && <p className="text-small text-muted">The Dune photograph and clip are independent works. No generation prompt or model is recorded for either. <Attribution asset={asset} /></p>}
      {parent && <p className="text-small">Based on <button className="button button-ghost" onClick={() => onParent(parent)}>{parent.title}</button></p>}
      {job?.snapshot.parentAssetId && !parent && <p className="text-small text-muted">Based on an earlier asset; its preview is unavailable here.</p>}
      <section className="detail-prompt"><h3>{asset.source === "sample" ? "Suggested prompt" : "Original prompt"}</h3><p>{job?.snapshot.prompt || suggestedPrompt || "Not recorded — this is an uploaded image."}</p></section>
      <dl className="detail-list"><dt>Media</dt><dd>{mediaFacts(asset)}</dd><dt>Source</dt><dd>{asset.source === "sample" ? "Prepared collection" : asset.source === "upload" ? "Your upload" : "Live generation"}</dd><dt>Model</dt><dd>{job?.snapshot.modelId || "Not recorded"}</dd>{job && <><dt>Requested output</dt><dd>{job.snapshot.operation === "image_to_video" ? "5-second video" : "One 1280 × 720 image"}</dd><dt>Request status</dt><dd>{job.status.replaceAll("_", " ")}</dd><dt>Created</dt><dd><time dateTime={job.createdAt}>{new Date(job.createdAt).toLocaleString()}</time></dd></>}<dt>File</dt><dd>{asset.fileName}</dd></dl>
      {job?.snapshot.startAsset && <section className="field-group"><h3>Original start frame</h3>{startFrame ? <div className="reference-preview"><img src={startFrame.mediaUrl} alt={`Original start frame: ${startFrame.title}`} /><div className="reference-info">{startFrame.title}<span>{startFrame.width} × {startFrame.height}</span></div></div> : <p className="text-small text-muted">The original reference is recorded; its preview is unavailable.</p>}<p className="text-small text-muted">Reusing this request keeps its original reference.</p></section>}
    </div>
    <footer className="dialog-actions"><button className="button button-primary" onClick={() => { onClose(); onReuse(); }}>{asset.source === "sample" ? "Use suggested prompt" : asset.kind === "image" ? "Animate this image" : "Revise this shot"}</button><a className="button button-secondary" href={asset.downloadUrl} download={asset.fileName}><Download aria-hidden="true" /> {asset.source === "sample" ? "Download sample" : "Download"}</a></footer>
  </dialog>;
}
