import { z } from "zod";
import type { ApiError } from "../contracts/studio";
import type { readServerConfig } from "../config/server";
export type Config = ReturnType<typeof readServerConfig>;
export class Fault extends Error {
  constructor(public status: number, public code: string, message: string, public fields?: Record<string,string>, public retryAfterSeconds?: number) { super(message); }
}
export const privateHeaders = { "Cache-Control": "private, no-store", Vary: "Cookie", "X-Content-Type-Options": "nosniff" };
export function ok(data: unknown, requestId: string, status = 200, headers: HeadersInit = {}) {
  return Response.json({ data, requestId }, { status, headers: { ...privateHeaders, ...headers } });
}
export function errorResponse(error: unknown, requestId: string) {
  const fault = error instanceof Fault ? error : sqlFault(error);
  const body: ApiError = { error: { code: fault.code, message: fault.message, retryable: fault.status === 503 || fault.status === 429, ...(fault.fields ? { fields: fault.fields } : {}), ...(fault.retryAfterSeconds ? { retryAfterSeconds: fault.retryAfterSeconds } : {}) }, requestId };
  return Response.json(body, { status: fault.status, headers: { ...privateHeaders, ...(fault.retryAfterSeconds ? { "Retry-After": String(fault.retryAfterSeconds) } : {}) } });
}
export function sqlFault(error: unknown) {
  const text = error instanceof Error ? `${error.message} ${error.cause instanceof Error ? error.cause.message : ""}` : "";
  for (const [code,status,message] of [
    ["GUEST_LIMIT",429,"Guest capacity is full. Try again later."], ["RECORD_QUOTA",429,"The saved-work limit has been reached."],
    ["STORAGE_QUOTA",429,"The media storage allowance has been reached."], ["JOB_ACTIVE",409,"Finish or resolve the current generation first."],
    ["BUDGET_ZERO",403,"Live generation has no approved spending allowance."], ["BUDGET_EXHAUSTED",429,"The generation allowance has been reached."],
    ["REVISION_CONFLICT",409,"This draft changed. Reload its saved version before continuing."],
  ] as const) if (text.includes(code)) return new Fault(status,code,message);
  return new Fault(503,"SERVICE_UNAVAILABLE","This action could not finish. Your saved work is retained. Try again later.");
}
export function requireOrigin(request: Request, config: Config) {
  if (!config.origin || request.headers.get("Origin") !== config.origin || request.headers.get("Sec-Fetch-Site") === "cross-site")
    throw new Fault(403,"ORIGIN_FORBIDDEN","Open this action from Frame Studio.");
}
export async function boundedBytes(body: ReadableStream<Uint8Array> | null, limit: number, length: string | null = null): Promise<Uint8Array<ArrayBuffer>> {
  if (length !== null && (!/^\d+$/.test(length) || !Number.isSafeInteger(Number(length)) || Number(length) > limit))
    throw new Fault(413,"UPLOAD_TOO_LARGE",`Use at most ${limit.toLocaleString("en-US")} bytes.`);
  if (!body) return new Uint8Array(0);
  const reader = body.getReader(); const chunks: Uint8Array[] = []; let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      total += value.byteLength;
      if (total > limit) { await reader.cancel(); throw new Fault(413,"UPLOAD_TOO_LARGE",`Use at most ${limit.toLocaleString("en-US")} bytes.`); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  if (length !== null && total !== Number(length)) throw new Fault(422,"VALIDATION_FAILED","The upload was incomplete.");
  const bytes = new Uint8Array(total); let at = 0;
  for (const chunk of chunks) { bytes.set(chunk,at); at += chunk.length; }
  return bytes;
}
export function uncompressed(request: Request) {
  const encoding = request.headers.get("Content-Encoding");
  if (encoding && encoding.toLowerCase() !== "identity") throw new Fault(415,"UNSUPPORTED_MEDIA_TYPE","Compressed request bodies are not supported.");
}
export async function json<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  uncompressed(request);
  if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get("Content-Type") || "")) throw new Fault(415,"UNSUPPORTED_MEDIA_TYPE","Send application/json.");
  const bytes = await boundedBytes(request.body,16384,request.headers.get("Content-Length")); let value: unknown;
  try { value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { throw new Fault(400,"INVALID_JSON","Send valid JSON."); }
  const result = schema.safeParse(value);
  if (!result.success) {
    const fields: Record<string,string> = {};
    for (const issue of result.error.issues) fields[issue.path.join(".") || "form"] = issue.message;
    throw new Fault(422,"VALIDATION_FAILED","Check the highlighted fields.",fields);
  }
  return result.data;
}
export const emptySchema = z.object({}).strict();
export const uuid = (value: string) => { if (!z.string().uuid().safeParse(value).success) throw new Fault(404,"NOT_FOUND","This item is unavailable."); return value; };
export const iso = (value: number) => new Date(value).toISOString();
export const sha256 = async (bytes: Uint8Array<ArrayBuffer> | string) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",typeof bytes === "string" ? new TextEncoder().encode(bytes) : bytes)), b => b.toString(16).padStart(2,"0")).join("");
export const keyFor = (guest: string, asset: string) => `private/${guest}/${asset}`;
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") return `{${Object.entries(value).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
  return JSON.stringify(value);
}
