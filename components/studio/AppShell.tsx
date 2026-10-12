"use client";
/* Full-document links intentionally wait for the draft-save guard before navigation. */
/* eslint-disable @next/next/no-html-link-for-pages */
import { Aperture, Compass, Clapperboard, Library, ArrowUpRight } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
export function AppShell({ active, children, beforeNavigate }: { active: "explore" | "studio" | "library"; children: ReactNode; beforeNavigate?: () => Promise<boolean> }) {
  async function navigate(event: MouseEvent<HTMLDivElement>) {
    if (!beforeNavigate || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = (event.target as Element).closest("a");
    if (!anchor || anchor.hasAttribute("download") || anchor.target === "_blank") return;
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin || anchor.getAttribute("href")?.startsWith("#")) return;
    event.preventDefault();
    if (await beforeNavigate()) window.location.assign(url.href);
  }
  return <div className="app-shell" onClick={navigate}>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <aside className="side-nav">
      <a className="brand" href="/" aria-label="Frame Studio — Explore"><Aperture aria-hidden="true" /><span>FRAME<span className="nav-label">STUDIO</span></span></a>
      <nav aria-label="Main navigation">
        <a className="nav-link" href="/" aria-current={active === "explore" ? "page" : undefined}><Compass aria-hidden="true" /><span className="nav-label">Explore</span></a>
        <a className="nav-link" href="/studio" aria-current={active === "studio" ? "page" : undefined}><Clapperboard aria-hidden="true" /><span className="nav-label">Studio</span></a>
        <a className="nav-link" href="/library" aria-current={active === "library" ? "page" : undefined}><Library aria-hidden="true" /><span className="nav-label">Library</span></a>
      </nav>
      <div className="nav-footer"><a href="https://github.com/Arhaan2/higgsfield-rebuild" target="_blank" rel="noreferrer" aria-label="Project source on GitHub (opens a new tab)"><ArrowUpRight aria-hidden="true" /><span className="nav-label">Source</span></a></div>
    </aside>
    <main className="main-content" id="main-content" tabIndex={-1}>{children}</main>
  </div>;
}
export function GenerationBadge() { return <span className="badge badge-muted">Live generation off</span>; }
