import { useEffect, useState, type MouseEvent } from "react";
import { createRoot } from "react-dom/client";
import { StudioView } from "../../components/studio/StudioView";
import { LibraryView } from "../../components/studio/LibraryView";
import { resetLibraryFixture } from "./fixture-api";
import { FixtureProvider, fixtureLabel, scenarios, type Scenario } from "./fixture-studio";
import "../../app/globals.css";
import "./fixture.css";

if (window.location.hostname !== "127.0.0.1") throw new Error("Open this fixture at http://127.0.0.1:5174 only.");
function Harness() {
  const query = new URLSearchParams(window.location.search).get("state");
  const [scenario, setScenario] = useState<Scenario>(scenarios.includes(query as Scenario) ? query as Scenario : "empty_draft");
  const [message, setMessage] = useState("Choose a state. Product actions are read-only; details, version selection, and sample playback are local inspection only.");
  const [largeText, setLargeText] = useState(false);
  useEffect(() => {
    document.documentElement.style.fontSize = largeText ? "200%" : "100%";
    return () => { document.documentElement.style.removeProperty("font-size"); };
  }, [largeText]);
  function guard(event: MouseEvent) {
    const target = event.target as Element;
    const anchor = target.closest("a");
    if ((anchor && !anchor.getAttribute("href")?.startsWith("#")) || target.closest('input[type="file"], #replace-reference')) {
      event.preventDefault(); event.stopPropagation();
      setMessage("Fixture blocked navigation, download, or upload. Nothing was sent or saved.");
    }
  }
  return <>
    <aside className="fixture-toolbar" aria-label="Isolated visual test controls">
      <strong>{fixtureLabel}</strong>
      <label>Visual state <select value={scenario} onChange={event => {
        const next = event.target.value as Scenario;
        resetLibraryFixture(); setScenario(next); setMessage("Fixture state selected. No product operation occurred.");
        window.history.replaceState(null, "", `/?state=${next}`);
      }}>{scenarios.map(state => <option key={state} value={state}>{state.replaceAll("_", " ")}</option>)}</select></label>
      <label><input type="checkbox" checked={largeText} onChange={event => setLargeText(event.target.checked)} />200% text size (isolated layout test)</label>
      <p>Sample pixels only: Jacob Castle / Unsplash (still); Lukas Rodriguez / Pexels (14.997s clip). No upload or generation occurred; source/status labels below exercise fixture branches.</p>
      <p role="status">{message}</p>
    </aside>
    <div onClickCapture={guard} onAuxClickCapture={guard} onContextMenu={event => event.preventDefault()} onSubmitCapture={event => event.preventDefault()}>
      {scenario === "library_partial_failure" ? <LibraryView key={scenario} /> : <FixtureProvider key={scenario} scenario={scenario} report={setMessage}><StudioView /></FixtureProvider>}
    </div>
  </>;
}
createRoot(document.getElementById("root")!).render(<Harness />);
