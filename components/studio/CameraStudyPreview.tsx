"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Asset } from "@/src/contracts/studio";
import type { CameraDirection } from "@/src/client/prompt-directions";

const RUN_MS = 5_000;
const transforms: Record<CameraDirection, [string, string]> = {
  "push-in": ["scale(1)", "scale(1.06)"],
  // 8% enlargement leaves 4% on either side; the 2% translation stays inside it.
  pan: ["translateX(-2%) scale(1.08)", "translateX(2%) scale(1.08)"],
  locked: ["none", "none"],
};

type Playback = { key: string; phase: "playing" | "finished" | "stopped" | "unsupported" };
type MediaState = { key: string; status: "ready" | "error" };

export function CameraStudyPreview({ reference, direction, contextKey, open }: {
  reference?: Asset;
  direction: CameraDirection;
  contextKey: string;
  open: boolean;
}) {
  const url = reference?.kind === "image" ? reference.mediaUrl : undefined;
  const referenceKey = JSON.stringify([reference?.id, url]);
  const runKey = JSON.stringify([contextKey, referenceKey, direction]);
  const image = useRef<HTMLImageElement>(null);
  const animation = useRef<Animation | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequence = useRef(0);
  const activeReference = useRef(referenceKey);
  const [media, setMedia] = useState<MediaState | null>(null);
  const [playback, setPlayback] = useState<Playback | null>(null);
  // Unknown is deliberately still until the browser's preference is observed.
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);
  const mediaStatus = !url ? "missing" : media?.key === referenceKey ? media.status : "loading";
  const phase = playback?.key === runKey ? playback.phase : "idle";
  const playing = phase === "playing" && open && reducedMotion === false;

  const cancel = useCallback(() => {
    sequence.current += 1;
    if (timeout.current !== null) clearTimeout(timeout.current);
    timeout.current = null;
    animation.current?.cancel();
    animation.current = null;
  }, []);

  const reset = useCallback(() => {
    cancel();
    setPlayback(null);
  }, [cancel]);

  useLayoutEffect(() => {
    activeReference.current = referenceKey;
    // A removed reference may later return with the same URL but a new img node.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMedia(null);
  }, [referenceKey]);

  useLayoutEffect(() => {
    // The external context invalidates the previous playback before paint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reset();
    return cancel;
  }, [referenceKey, contextKey, direction, open, reset, cancel]);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      reset();
      setReducedMotion(preference.matches);
    };
    update();
    preference.addEventListener("change", update);
    const onVisibility = () => { if (document.hidden) reset(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      preference.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", onVisibility);
      cancel();
    };
  }, [reset, cancel]);

  const isCurrentImage = useCallback((node: HTMLImageElement) => {
    if (!url || activeReference.current !== referenceKey || node !== image.current) return false;
    const expected = new URL(url, document.baseURI).href;
    return node.src === expected && (!node.currentSrc || node.currentSrc === expected);
  }, [url, referenceKey]);

  useEffect(() => {
    // A cached image can finish before React attaches the load handler.
    const node = image.current;
    if (node && isCurrentImage(node) && node.complete) {
      setMedia({ key: referenceKey, status: node.naturalWidth > 0 ? "ready" : "error" });
    }
  }, [referenceKey, isCurrentImage]);

  function play() {
    const node = image.current;
    if (!open || document.hidden || mediaStatus !== "ready" || !node || !isCurrentImage(node) || !node.complete || node.naturalWidth === 0 || timeout.current !== null) return;
    // Re-check synchronously as a preference can change before its event arrives.
    if (reducedMotion !== false || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      reset();
      setReducedMotion(true);
      return;
    }
    cancel();
    const token = sequence.current;
    if (direction !== "locked") {
      try {
        animation.current = node.animate(transforms[direction].map(transform => ({ transform })), {
          duration: RUN_MS, iterations: 1, easing: "ease-in-out", fill: "forwards",
        });
      } catch {
        cancel();
        setPlayback({ key: runKey, phase: "unsupported" });
        return;
      }
    }
    setPlayback({ key: runKey, phase: "playing" });
    // Completion is bounded even if animation events never fire (including locked).
    timeout.current = setTimeout(() => {
      if (sequence.current !== token) return;
      cancel();
      setPlayback({ key: runKey, phase: "finished" });
    }, RUN_MS);
  }

  function stop() {
    cancel();
    setPlayback({ key: runKey, phase: "stopped" });
  }

  const still = reducedMotion !== false;
  const imageTransform = still ? "none" : transforms[direction][phase === "finished" ? 1 : 0];
  const status = mediaStatus === "missing" ? "Choose a start frame to study its framing."
    : mediaStatus === "loading" ? "Loading your reference image…"
      : mediaStatus === "error" ? "Your reference image could not be loaded. The camera study is unavailable."
        : reducedMotion === null ? "Checking your motion preference…"
          : reducedMotion ? "Reduced motion is on. Showing a still reference; movement playback is disabled."
            : phase === "unsupported" ? "Movement preview is unavailable in this browser. Your reference is shown as a still."
              : playing ? direction === "locked" ? "Playing a five-second stationary study." : "Playing local image movement for five seconds."
                : phase === "finished" ? "Camera study finished. Replay to view it again."
                  : phase === "stopped" ? "Camera study stopped. Replay starts from the beginning."
                    : direction === "locked" ? "Locked framing keeps your reference stationary for five seconds." : "Ready. Play one five-second camera study.";

  return <section className="camera-study" hidden={!open} aria-label="Local camera study" data-playing={playing} data-direction={direction}>
    <div className="camera-study-heading">
      <h4>Camera study · 5 seconds</h4>
      <p className="field-help">Local movement of your reference image. This is not an AI-generated video.</p>
    </div>
    <div className="camera-study-frame" aria-busy={mediaStatus === "loading"}>
      {url && <img ref={image} className="camera-study-image" src={url}
        alt={`Reference image: ${reference?.title.trim() || reference?.fileName || "your start frame"}`}
        draggable={false} style={{ transform: imageTransform, visibility: mediaStatus === "ready" ? "visible" : "hidden" }}
        onLoad={event => {
          if (isCurrentImage(event.currentTarget) && event.currentTarget.complete && event.currentTarget.naturalWidth > 0) setMedia({ key: referenceKey, status: "ready" });
        }}
        onError={event => {
          if (!isCurrentImage(event.currentTarget) || !event.currentTarget.complete || event.currentTarget.naturalWidth > 0) return;
          reset();
          setMedia({ key: referenceKey, status: "error" });
        }} />}
      {mediaStatus !== "ready" && <p className="camera-study-placeholder">{mediaStatus === "missing" ? "No start frame" : mediaStatus === "error" ? "Image unavailable" : "Loading image…"}</p>}
    </div>
    <p className="field-help camera-study-status" role="status" aria-live="polite" aria-atomic="true">{status}</p>
    <div className="camera-study-controls">
      <button type="button" className="button button-secondary" disabled={!open || mediaStatus !== "ready" || still || playing || phase === "unsupported"} onClick={play}>{phase === "finished" || phase === "stopped" ? "Replay" : "Play"}</button>
      <button type="button" className="button button-ghost" disabled={!playing} onClick={stop}>Stop</button>
    </div>
  </section>;
}
