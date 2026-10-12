"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import type { Asset } from "@/src/contracts/studio";
export function AssetMedia({ asset }: { asset: Asset }) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return <div className="media-well">
    {failed ? <div className="empty-state" role="alert"><p>This media could not be loaded. Your draft and its details are unchanged.</p><button className="button button-secondary" onClick={() => { setFailed(false); setAttempt(value => value + 1); }}><RefreshCw aria-hidden="true" /> Retry media</button><a className="button button-ghost" href={asset.downloadUrl} download={asset.fileName}>Try the download</a></div> : asset.kind === "video" ? <video key={`${asset.id}:${attempt}`} src={asset.mediaUrl} poster={asset.posterUrl || undefined} controls playsInline preload="metadata" aria-label={asset.title} onError={() => setFailed(true)} /> : <img key={`${asset.id}:${attempt}`} src={asset.mediaUrl} alt={asset.title} width={asset.width || undefined} height={asset.height || undefined} onError={() => setFailed(true)} />}
  </div>;
}
export function Attribution({ asset }: { asset: Asset }) { return asset.attribution ? <span>{asset.attribution.url ? <a href={asset.attribution.url} target="_blank" rel="noreferrer">{asset.attribution.label} <span className="text-small">↗</span></a> : asset.attribution.label}</span> : null; }
export function mediaFacts(asset: Asset) { return [asset.width && asset.height ? `${asset.width} × ${asset.height}` : null, asset.durationSeconds !== null ? `${asset.durationSeconds.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")} seconds` : null, `${(asset.byteSize / 1_000_000).toFixed(2)} MB`].filter(Boolean).join(" · "); }
