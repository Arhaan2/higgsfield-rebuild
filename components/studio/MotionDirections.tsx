"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Asset } from "@/src/contracts/studio";
import {
  CAMERA_DIRECTIONS,
  MOVEMENT_TEXT_LIMIT,
  movementTextLength,
  retainPromptReplacement,
  type CameraDirection,
  type PromptReplacement,
} from "@/src/client/prompt-directions";
import { CameraStudyPreview } from "./CameraStudyPreview";

export type MotionDirectionsProps = {
  prompt: string;
  contextKey: string;
  reference?: Asset;
  disabled?: boolean;
  onReplacePrompt: (text: string, expectedContextKey: string, expectedCurrentPrompt?: string) => PromptReplacement | null;
};

// The key also resets the disclosure and local wording if a caller changes context in place.
export function MotionDirections(props: MotionDirectionsProps) {
  return <MotionDirectionsForContext key={props.contextKey} {...props} />;
}

function MotionDirectionsForContext({ prompt, contextKey, reference, disabled = false, onReplacePrompt }: MotionDirectionsProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<CameraDirection>("push-in");
  const [proposal, setProposal] = useState(CAMERA_DIRECTIONS[0].prompt);
  const [replacement, setReplacement] = useState<PromptReplacement | null>(null);
  const replacementRef = useRef<PromptReplacement | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; error: boolean }>({ text: "", error: false });
  const length = movementTextLength(proposal);
  const tooLong = length > MOVEMENT_TEXT_LIMIT;
  const currentTooLong = movementTextLength(prompt) > MOVEMENT_TEXT_LIMIT;
  const canUndo = !!retainPromptReplacement(replacement, contextKey, prompt);

  useEffect(() => {
    // Discard history permanently on the first observed draft edit. Comparing only at
    // click time would incorrectly revive Undo when someone types the applied text again.
    if (replacementRef.current && !retainPromptReplacement(replacementRef.current, contextKey, prompt)) {
      replacementRef.current = null;
      setReplacement(null);
      setFeedback({ text: "Movement text changed. The previous replacement can no longer be undone here.", error: false });
    }
  }, [contextKey, prompt]);

  useEffect(() => () => { replacementRef.current = null; }, []);

  function choose(value: CameraDirection) {
    const option = CAMERA_DIRECTIONS.find(item => item.id === value);
    if (!option || disabled) return;
    setDirection(option.id);
    setProposal(option.prompt);
    setFeedback({ text: "", error: false });
  }

  function replace() {
    if (disabled) return;
    if (currentTooLong) {
      setFeedback({ text: "Shorten your current movement text to 2,500 characters before replacing it, so Undo can restore the full draft.", error: true });
      return;
    }
    if (tooLong) {
      setFeedback({ text: "Keep the proposed movement text within 2,500 characters. Nothing was replaced.", error: true });
      return;
    }
    // The coordinator reads the latest buffer synchronously. The prompt prop is
    // deliberately not used to capture `before`, because it may lag a recent edit.
    const applied = onReplacePrompt(proposal, contextKey);
    if (!applied) {
      setFeedback({ text: "Movement text could not be replaced. Your current draft is unchanged.", error: true });
      return;
    }
    replacementRef.current = applied.before === applied.after ? null : applied;
    setReplacement(replacementRef.current);
    setFeedback({ text: applied.before === applied.after ? "Movement text already matches the proposed wording." : "Movement text replaced. You can undo until you edit it or change the shot context.", error: false });
  }

  function undo() {
    if (disabled) return;
    const current = retainPromptReplacement(replacementRef.current, contextKey, prompt);
    if (!current) return;
    // The optional third argument is the final atomic guard against an edit between
    // this render and the click. Root also checks context and all edit availability.
    const restored = onReplacePrompt(current.before, current.contextKey, current.after);
    replacementRef.current = null;
    setReplacement(null);
    setFeedback({ text: restored ? "Previous movement text restored." : "Undo is no longer available. Your current draft is unchanged.", error: !restored });
  }

  return <details className="motion-directions" open={open} onToggle={event => setOpen(event.currentTarget.open)}>
    <summary className="motion-directions-summary">Camera direction ideas</summary>
    <div className="motion-directions-content">
      <p className="field-help" id={`${id}-help`}>Prepared writing suggestions you can edit. They do not guarantee camera control in a generated clip.</p>
      <fieldset className="motion-directions-options" disabled={disabled} aria-describedby={`${id}-help`}>
        <legend className="field-label">Choose a direction</legend>
        {CAMERA_DIRECTIONS.map(option => <label className="motion-direction-option" key={option.id}>
          <input type="radio" name={`${id}-direction`} value={option.id} checked={direction === option.id} onChange={() => choose(option.id)} />
          <span>{option.label}</span>
        </label>)}
      </fieldset>
      <CameraStudyPreview reference={reference} direction={direction} contextKey={contextKey} open={open} />
      <div className="field-group motion-directions-wording">
        <label className="field-label" htmlFor={`${id}-proposal`}>Proposed movement text</label>
        <textarea className="prompt-input motion-directions-proposal" id={`${id}-proposal`} rows={4} value={proposal} disabled={disabled} aria-invalid={tooLong} aria-describedby={`${id}-replace-help ${id}-count`} onChange={event => { setProposal(event.target.value); setFeedback({ text: "", error: false }); }} />
        <p className="field-help" id={`${id}-replace-help`}>Review this wording. Replace movement text swaps the entire movement draft for exactly the text above.</p>
        <p className={tooLong ? "error-text" : "field-help"} id={`${id}-count`}>{length.toLocaleString()} / 2,500 characters{tooLong ? " — shorten the wording before replacing; no text has been cut." : ""}</p>
      </div>
      {currentTooLong && <p className="error-text" id={`${id}-current-limit`}>Shorten your current movement text to 2,500 characters before replacing it, so Undo can restore the full draft.</p>}
      <div className="motion-directions-actions">
        <button type="button" className="button button-secondary" disabled={disabled || tooLong || currentTooLong} aria-describedby={currentTooLong ? `${id}-current-limit` : undefined} onClick={replace}>Replace movement text</button>
        <button type="button" className="button button-ghost" disabled={disabled || !canUndo} onClick={undo}>Undo replacement</button>
      </div>
      <p className={feedback.error ? "error-text" : "field-help"} role={feedback.error ? "alert" : "status"} aria-atomic="true">{feedback.text}</p>
    </div>
  </details>;
}
