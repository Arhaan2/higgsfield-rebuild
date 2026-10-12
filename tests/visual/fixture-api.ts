import type { api as productionApi } from "../../src/client/api";
import { fixtureAssets, fixtureReference } from "./fixture-studio";
import { emptyDraft, type Project } from "../../src/contracts/studio";

export class StudioApiError extends Error { constructor(public status: number) { super("Isolated fixture preview unavailable"); } }
export const errorMessage = (error: unknown) => error instanceof Error ? error.message : "Isolated fixture error";
let previewReads = 0;
export function resetLibraryFixture() { previewReads = 0; }
const libraryProject: Project = {
  id: "fixture-library-shot", title: "FIXTURE saved shot — no server save", draft: emptyDraft("image_to_video"), revision: 1,
  preferredAssetId: fixtureReference.id, createdAt: "2026-10-12T01:35:00Z", updatedAt: "2026-10-12T01:35:00Z",
};

// AssetDetails looks up its immutable reference directly. No production API code
// is bundled; missing fixtures reject instead of pretending to load successfully.
export const api: Pick<typeof productionApi, "asset" | "projects" | "project"> = {
  async projects() { return { items: [libraryProject], nextCursor: null }; },
  async project() {
    if (++previewReads === 1) throw new StudioApiError(503);
    return { project: libraryProject, assets: [fixtureReference], jobs: [] };
  },
  async asset(id) {
    const asset = fixtureAssets.find(item => item.id === id);
    if (!asset) throw new Error("Isolated fixture asset unavailable");
    return asset;
  },
};
