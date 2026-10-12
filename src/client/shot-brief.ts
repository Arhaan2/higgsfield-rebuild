import { IMAGE_MODEL, IMAGE_SETTINGS, VIDEO_MODEL, VIDEO_SETTINGS, type Asset, type Draft, type Project } from "@/src/contracts/studio";
import { SAMPLE_ASSETS } from "@/src/catalog/samples";

type ShotBriefInput = {
  title: string;
  draft: Draft;
  project: Project | null;
  saved: boolean;
  saving: boolean;
  assets: readonly Asset[];
};

export type ShotBrief = { markdown: string; fileName: string };

// Use a fence longer than every run in the input. Never trim or normalize prompt text.
function literal(value: string, language = "text"): string {
  const longest = Math.max(0, ...Array.from(value.matchAll(/`+/g), match => match[0].length));
  const fence = "`".repeat(Math.max(3, longest + 1));
  return `${fence}${language}\n${value}\n${fence}`;
}

function matchesConfirmedSave(input: ShotBriefInput): boolean {
  const saved = input.project;
  const draft = input.draft;
  return !!saved && input.saved && !input.saving && Number.isInteger(saved.revision) && saved.revision > 0
    && input.title === saved.title && draft.operation === saved.draft.operation
    && draft.prompt === saved.draft.prompt && draft.presetId === saved.draft.presetId
    && draft.parentAssetId === saved.draft.parentAssetId
    && (draft.operation !== "image_to_video" || (saved.draft.operation === "image_to_video" && draft.startAssetId === saved.draft.startAssetId));
}

function referenceFacts(draft: Draft, assets: readonly Asset[]): string {
  if (draft.operation === "text_to_image") return "Not used by the current Create image task.";
  if (!draft.startAssetId) return "No start frame selected.";
  // Only the active draft's start frame is relevant; stage selection is deliberately absent.
  const reference = assets.find(asset => asset.id === draft.startAssetId && asset.kind === "image");
  if (!reference) return "Start-frame metadata unavailable. The draft references this local asset ID:\n\n" + literal(draft.startAssetId);
  const source = reference.source === "sample" ? "Prepared sample — not generated from this draft."
    : reference.source === "upload" ? "User upload — original generation prompt and model unavailable."
      : "Generated image — original generation settings are not included in this brief.";
  const dimensions = reference.width != null && reference.height != null ? `${reference.width} × ${reference.height} px` : "Unavailable";
  const size = Number.isFinite(reference.byteSize) && reference.byteSize >= 0 ? `${reference.byteSize} bytes` : "Unavailable";
  // Only canonical public catalog attribution pages are portable. Never copy a media,
  // download, poster, or arbitrary attribution URL from session-dependent metadata.
  const publicSource = reference.source === "sample" ? SAMPLE_ASSETS.find(asset => asset.id === reference.id)?.attribution : null;
  const publicUrl = publicSource?.url && publicSource.url === reference.attribution?.url ? publicSource.url : null;
  return [
    source,
    "### Start-frame title", literal(reference.title),
    "### Original filename", literal(reference.fileName),
    `- Media type: ${reference.mimeType}\n- Dimensions: ${dimensions}\n- File size: ${size}`,
    "### Source / attribution", reference.attribution?.label ? literal(reference.attribution.label) : "Unavailable — no source attribution was supplied.",
    publicUrl ? `Public source page: <${publicUrl}>` : "Portable source link unavailable or omitted for privacy.",
    "Start-frame facts describe the existing image, not the requested output. No generated result or result lineage is asserted by this export.",
  ].join("\n\n");
}

function safeFileName(title: string): string {
  // Restrict the filename, not its content. A fixed prefix also avoids OS reserved names.
  const stem = title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64).replace(/-+$/g, "");
  return `shot-brief${stem ? `-${stem}` : ""}.md`;
}

/** Synchronously format one render's current values; no saves, requests, or state changes. */
export function createShotBrief(input: ShotBriefInput): ShotBrief {
  const { draft } = input;
  const image = draft.operation === "text_to_image";
  const saved = matchesConfirmedSave(input);
  const markdown = [
    "# Shot brief",
    saved ? `Saved draft — revision ${input.project!.revision}` : "Working draft — unsaved",
    input.saving ? "A save is in flight. This export contains the current working text, without waiting for or changing that save."
      : saved ? "The title and active draft exactly match the confirmed saved revision."
        : "This export preserves the current title and active draft, including unsaved edits and whitespace. No saved revision is claimed.",
    "## Shot title", literal(input.title),
    `## Active task\n\n${image ? "Create image (text to image)" : "Animate image (image to video)"}`,
    "## Current prompt",
    "Exact current text is inside the fenced block. Its final separator newline belongs to the Markdown wrapper; all prompt whitespace and Unicode are retained.",
    literal(draft.prompt),
    ...(draft.prompt ? [] : ["The current prompt is empty."]),
    "## Requested generation settings",
    "These are the active task’s configured settings for a future request. Exporting does not submit a generation request. They do not describe how an uploaded image or prepared sample was made.",
    `- Provider: fal\n- Model: ${image ? IMAGE_MODEL : VIDEO_MODEL}`,
    literal(JSON.stringify(image ? IMAGE_SETTINGS : VIDEO_SETTINGS, null, 2), "json"),
    "### Draft preset", draft.presetId ? literal(draft.presetId) : "None selected.",
    "A preset is a starting point for editing, not evidence that it produced any media.",
    "## Draft start frame", referenceFacts(draft, input.assets),
    "## Media files",
    "Media files are not embedded. Download available media separately from its preview in Studio. Private media and download links are omitted because they depend on the original browser session.",
  ].join("\n\n") + "\n";
  return { markdown, fileName: safeFileName(input.title) };
}

/** Request a local browser download without navigation or any network mutation. */
export function downloadShotBrief(brief: ShotBrief): void {
  const url = URL.createObjectURL(new Blob([brief.markdown], { type: "text/markdown;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = brief.fileName;
  link.hidden = true;
  try {
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    // Allow the browser to consume the Blob before releasing its URL.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}
