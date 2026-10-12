import type { ApiError, ApiResult, Asset, Capabilities, Draft, Job, ListResult, Project, ProjectDetail } from "@/src/contracts/studio";

export class StudioApiError extends Error {
  constructor(message: string, public status: number, public code: string, public retryable = false) { super(message); this.name = "StudioApiError"; }
}
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try { response = await fetch(path, { credentials: "same-origin", cache: "no-store", ...init }); }
  catch { throw new StudioApiError("The connection was interrupted. Your edits are still here. Try again when you’re connected.", 0, "CONNECTION_LOST", true); }
  let body: ApiResult<T> | ApiError;
  try { body = await response.json(); }
  catch { throw new StudioApiError("The studio could not read the server response. Your edits are still here.", response.status, "INVALID_RESPONSE", true); }
  if (!body || typeof body !== "object" || (!("data" in body) && !("error" in body))) {
    throw new StudioApiError("The studio received an incomplete response. Your edits are still here; try again.", response.status, "INVALID_RESPONSE", true);
  }
  if (!response.ok || "error" in body) {
    const error = "error" in body ? body.error : null;
    const details = error?.fields ? Object.values(error.fields).join(" ") : "";
    throw new StudioApiError(details || error?.message || "The studio is temporarily unavailable. Please try again.", response.status, error?.code || "SERVICE_UNAVAILABLE", error?.retryable ?? true);
  }
  return body.data;
}
const json = (method: string, body: unknown): RequestInit => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
export const api = {
  capabilities: () => request<Capabilities>("/api/capabilities"),
  guest: () => request<{ expiresAt: string }>("/api/guest", json("POST", {})),
  projects: (cursor?: string) => request<ListResult<Project>>(`/api/projects${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`),
  project: (id: string) => request<ProjectDetail>(`/api/projects/${encodeURIComponent(id)}`),
  createProject: (body: { id: string; title: string; draft: Draft }) => request<Project>("/api/projects", json("POST", body)),
  saveProject: (id: string, body: { expectedRevision: number; title?: string; draft?: Draft; preferredAssetId?: string | null }) => request<Project>(`/api/projects/${encodeURIComponent(id)}`, json("PATCH", body)),
  asset: (id: string) => request<Asset>(`/api/assets/${encodeURIComponent(id)}`),
  upload: (projectId: string, assetId: string, file: File) => request<Asset>(`/api/projects/${encodeURIComponent(projectId)}/uploads?assetId=${encodeURIComponent(assetId)}&filename=${encodeURIComponent(file.name)}`, { method: "POST", headers: { "Content-Type": file.type }, body: file }),
  submit: (id: string, body: { requestKey: string; draftRevision: number }) => request<Job>(`/api/projects/${encodeURIComponent(id)}/jobs`, json("POST", body)),
  refresh: (id: string) => request<Job>(`/api/jobs/${encodeURIComponent(id)}/refresh`, json("POST", {})),
  retryTransfer: (id: string) => request<Job>(`/api/jobs/${encodeURIComponent(id)}/retry-transfer`, json("POST", {})),
};
export const errorMessage = (error: unknown) => error instanceof Error ? error.message : "Something went wrong. Your edits are still here.";
