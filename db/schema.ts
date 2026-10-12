import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index, uniqueIndex, primaryKey, foreignKey, check } from "drizzle-orm/sqlite-core";

// Append src/server/schema-guards.sql to the first migration before applying it.
export const guests = sqliteTable("guests", {
  id: text("id").primaryKey(), tokenHash: text("token_hash").notNull().unique(),
  createdAt: integer("created_at").notNull(), expiresAt: integer("expires_at").notNull(),
}, t => [check("guest_hash", sql`length(${t.tokenHash}) = 64`), check("guest_expiry", sql`${t.expiresAt} > ${t.createdAt}`)]);
export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(), guestId: text("guest_id").notNull().references(() => guests.id),
  title: text("title").notNull(), draftJson: text("draft_json").notNull(), revision: integer("revision").notNull().default(1),
  preferredAssetId: text("preferred_asset_id"), createdAt: integer("created_at").notNull(), updatedAt: integer("updated_at").notNull(),
}, t => [uniqueIndex("project_owner").on(t.id, t.guestId), index("projects_guest_date").on(t.guestId, t.createdAt, t.id),
  check("project_title", sql`length(${t.title}) BETWEEN 1 AND 80`), check("project_draft", sql`json_valid(${t.draftJson})`),
  check("project_revision", sql`${t.revision} > 0`)]);
export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey(), guestId: text("guest_id").notNull().references(() => guests.id), projectId: text("project_id").notNull(),
  requestKey: text("request_key").notNull(), requestedRevision: integer("requested_revision").notNull(), submitHash: text("submit_hash").notNull(),
  snapshotJson: text("snapshot_json").notNull(), status: text("status").notNull(),
  providerRequestId: text("provider_request_id").unique(), providerStatusUrl: text("provider_status_url"), providerResultUrl: text("provider_result_url"),
  providerOutputJson: text("provider_output_json"), actualMetadataJson: text("actual_metadata_json"), outputAssetId: text("output_asset_id").unique(),
  errorCode: text("error_code"), errorMessage: text("error_message"), reserveMicroUsd: integer("reserve_micro_usd").notNull(),
  accountingState: text("accounting_state").notNull(), leaseToken: text("lease_token"), leaseExpiresAt: integer("lease_expires_at"),
  nextPollAt: integer("next_poll_at"), lastCheckedAt: integer("last_checked_at"),
  createdAt: integer("created_at").notNull(), updatedAt: integer("updated_at").notNull(),
}, t => [uniqueIndex("jobs_request_key").on(t.guestId, t.requestKey), index("jobs_guest_status").on(t.guestId, t.status),
  index("jobs_accounting").on(t.accountingState), index("jobs_project_date").on(t.projectId, t.createdAt),
  foreignKey({ columns: [t.projectId, t.guestId], foreignColumns: [projects.id, projects.guestId] }),
  check("job_status", sql`${t.status} IN ('prepared','submitting','submission_unknown','queued','running','storing','succeeded','failed','transfer_failed')`),
  check("job_accounting", sql`${t.accountingState} IN ('held','committed','released')`),
  check("job_cost", sql`${t.reserveMicroUsd} > 0`), check("job_revision", sql`${t.requestedRevision} > 0`),
  check("job_snapshot", sql`json_valid(${t.snapshotJson})`),
  check("job_output", sql`${t.providerOutputJson} IS NULL OR json_valid(${t.providerOutputJson})`),
  check("job_metadata", sql`${t.actualMetadataJson} IS NULL OR json_valid(${t.actualMetadataJson})`)]);
export const assets = sqliteTable("assets", {
  id: text("id").primaryKey(), guestId: text("guest_id").notNull().references(() => guests.id), projectId: text("project_id").notNull(),
  source: text("source").notNull(), kind: text("kind").notNull(), objectKey: text("object_key").notNull().unique(),
  fileName: text("file_name").notNull(), mimeType: text("mime_type").notNull(), byteSize: integer("byte_size").notNull(),
  width: integer("width"), height: integer("height"), durationMs: integer("duration_ms"), sha256: text("sha256").notNull(),
  sourceJobId: text("source_job_id").unique().references(() => jobs.id), createdAt: integer("created_at").notNull(),
}, t => [index("assets_project_date").on(t.projectId, t.createdAt), index("assets_guest").on(t.guestId),
  foreignKey({ columns: [t.projectId, t.guestId], foreignColumns: [projects.id, projects.guestId] }),
  check("asset_source", sql`${t.source} IN ('upload','generation')`),
  check("asset_media", sql`(${t.kind} = 'image' AND ${t.mimeType} IN ('image/jpeg','image/png')) OR (${t.kind} = 'video' AND ${t.mimeType} = 'video/mp4')`),
  check("asset_size", sql`${t.byteSize} > 0 AND ${t.byteSize} <= 20000000`), check("asset_hash", sql`length(${t.sha256}) = 64`)]);
export const budgetPolicy = sqliteTable("budget_policy", {
  id: integer("id").primaryKey(), capMicroUsd: integer("cap_micro_usd").notNull().default(0), updatedAt: integer("updated_at").notNull(),
}, t => [check("policy_singleton", sql`${t.id} = 1`), check("policy_cap", sql`${t.capMicroUsd} >= 0`)]);
export const storageReservations = sqliteTable("storage_reservations", {
  id: text("id").primaryKey(), guestId: text("guest_id").notNull().references(() => guests.id), projectId: text("project_id").notNull(),
  assetId: text("asset_id").notNull().unique(), jobId: text("job_id").unique().references(() => jobs.id), bytes: integer("bytes").notNull(),
  state: text("state").notNull(), contentSha256: text("content_sha256"), contentMimeType: text("content_mime_type"),
  leaseToken: text("lease_token"), leaseExpiresAt: integer("lease_expires_at"), createdAt: integer("created_at").notNull(), updatedAt: integer("updated_at").notNull(),
}, t => [index("storage_guest_state").on(t.guestId, t.state), index("storage_state").on(t.state),
  foreignKey({ columns: [t.projectId, t.guestId], foreignColumns: [projects.id, projects.guestId] }),
  check("reservation_bytes", sql`${t.bytes} > 0 AND ${t.bytes} <= 20000000`), check("reservation_state", sql`${t.state} IN ('held','stored','released')`)]);
export const rateBuckets = sqliteTable("rate_buckets", {
  scope: text("scope").notNull(), subject: text("subject").notNull(), windowStart: integer("window_start").notNull(), count: integer("count").notNull(),
}, t => [primaryKey({ columns: [t.scope, t.subject, t.windowStart] }), check("rate_count", sql`${t.count} > 0`)]);
