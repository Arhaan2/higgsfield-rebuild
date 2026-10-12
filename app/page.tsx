import { ArrowRight, Play, MoveUpRight } from "lucide-react";
import { AppShell, GenerationBadge } from "@/components/studio/AppShell";
import { PRESETS, SAMPLE_ASSETS } from "@/src/catalog/samples";
export default function ExplorePage() {
  const still = SAMPLE_ASSETS[0];
  return <AppShell active="explore">
    <header className="page-header"><div><p className="eyebrow">A space for the next scene</p><h1 className="page-title">Explore</h1></div><div className="header-actions"><GenerationBadge /><a className="button button-secondary" href="/studio">Open Studio <ArrowRight aria-hidden="true" /></a></div></header>
    <section className="explore-hero" aria-labelledby="hero-title">
      <div className="hero-copy"><p className="eyebrow">THE DUNE STUDY / 001</p><h2 className="hero-title" id="hero-title">One idea.<br />One cinematic shot.</h2><p className="hero-description">Find a frame. Shape the movement. Keep the version that feels right.</p><div className="hero-actions"><a className="button button-primary" href="/studio?preset=dune-light">Start with a prompt <ArrowRight aria-hidden="true" /></a><a className="button button-secondary" href="/studio?sample=dune-study"><Play aria-hidden="true" /> Explore the sample</a></div><p className="text-small text-muted">Drafts, references, and a little room to experiment.<br />Spending is disabled. Your ideas don’t have to be.</p></div>
      <figure className="hero-media"><img src={still.mediaUrl} alt="Warm sunset light tracing the ridges of sculptural desert dunes" width={still.width!} height={still.height!} fetchPriority="high" /><figcaption className="hero-caption"><span className="badge badge-sample">Prepared image</span><span>Dune light <span aria-hidden="true">/</span> Jacob Castle</span><a href={still.attribution!.url!} target="_blank" rel="noreferrer" aria-label="Dune light source on Unsplash (opens a new tab)"><MoveUpRight aria-hidden="true" /></a></figcaption></figure>
    </section>
    <section aria-labelledby="presets-title"><div className="section-header"><div><p className="eyebrow">A FIRST DIRECTION</p><h2 id="presets-title">A few ways into the frame.</h2></div><p className="text-small text-muted">Three prompts to make your own.</p></div>
      <div className="preset-grid">{PRESETS.map((preset, index) => { const asset = SAMPLE_ASSETS.find(item => item.id === preset.previewAssetId)!; return <article className="preset-card" key={preset.id}><div className="preset-preview"><img src={asset.posterUrl || asset.mediaUrl} alt={asset.kind === "video" ? "Aerial view across the dunes, from independent prepared footage" : "Prepared dune photograph, inspiration for this prompt"} width={asset.width!} height={asset.height!} loading="lazy" /><span className="badge badge-sample">Prepared preview</span></div><div className="preset-body"><p className="preset-index">0{index + 1} / {preset.operation === "text_to_image" ? "STILL" : "MOTION"}</p><h3 className="preset-title">{preset.title}</h3><p className="preset-description">{preset.description}</p><a className="preset-action button button-ghost" href={`/studio?preset=${preset.id}`}>Use prompt <ArrowRight aria-hidden="true" /></a></div></article>; })}</div>
      <p className="text-small text-muted">Prepared media is inspiration, not a result of these prompts. Using a prompt opens a draft; it does not generate.</p>
    </section>
  </AppShell>;
}
