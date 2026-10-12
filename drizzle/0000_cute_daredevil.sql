CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`guest_id` text NOT NULL,
	`project_id` text NOT NULL,
	`source` text NOT NULL,
	`kind` text NOT NULL,
	`object_key` text NOT NULL,
	`file_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`byte_size` integer NOT NULL,
	`width` integer,
	`height` integer,
	`duration_ms` integer,
	`sha256` text NOT NULL,
	`source_job_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`guest_id`) REFERENCES `guests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`,`guest_id`) REFERENCES `projects`(`id`,`guest_id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "asset_source" CHECK("assets"."source" IN ('upload','generation')),
	CONSTRAINT "asset_media" CHECK(("assets"."kind" = 'image' AND "assets"."mime_type" IN ('image/jpeg','image/png')) OR ("assets"."kind" = 'video' AND "assets"."mime_type" = 'video/mp4')),
	CONSTRAINT "asset_size" CHECK("assets"."byte_size" > 0 AND "assets"."byte_size" <= 20000000),
	CONSTRAINT "asset_hash" CHECK(length("assets"."sha256") = 64)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `assets_object_key_unique` ON `assets` (`object_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `assets_source_job_id_unique` ON `assets` (`source_job_id`);--> statement-breakpoint
CREATE INDEX `assets_project_date` ON `assets` (`project_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `assets_guest` ON `assets` (`guest_id`);--> statement-breakpoint
CREATE TABLE `budget_policy` (
	`id` integer PRIMARY KEY NOT NULL,
	`cap_micro_usd` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "policy_singleton" CHECK("budget_policy"."id" = 1),
	CONSTRAINT "policy_cap" CHECK("budget_policy"."cap_micro_usd" >= 0)
);
--> statement-breakpoint
CREATE TABLE `guests` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	CONSTRAINT "guest_hash" CHECK(length("guests"."token_hash") = 64),
	CONSTRAINT "guest_expiry" CHECK("guests"."expires_at" > "guests"."created_at")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guests_token_hash_unique` ON `guests` (`token_hash`);--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`guest_id` text NOT NULL,
	`project_id` text NOT NULL,
	`request_key` text NOT NULL,
	`requested_revision` integer NOT NULL,
	`submit_hash` text NOT NULL,
	`snapshot_json` text NOT NULL,
	`status` text NOT NULL,
	`provider_request_id` text,
	`provider_status_url` text,
	`provider_result_url` text,
	`provider_output_json` text,
	`actual_metadata_json` text,
	`output_asset_id` text,
	`error_code` text,
	`error_message` text,
	`reserve_micro_usd` integer NOT NULL,
	`accounting_state` text NOT NULL,
	`lease_token` text,
	`lease_expires_at` integer,
	`next_poll_at` integer,
	`last_checked_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`guest_id`) REFERENCES `guests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`,`guest_id`) REFERENCES `projects`(`id`,`guest_id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "job_status" CHECK("jobs"."status" IN ('prepared','submitting','submission_unknown','queued','running','storing','succeeded','failed','transfer_failed')),
	CONSTRAINT "job_accounting" CHECK("jobs"."accounting_state" IN ('held','committed','released')),
	CONSTRAINT "job_cost" CHECK("jobs"."reserve_micro_usd" > 0),
	CONSTRAINT "job_revision" CHECK("jobs"."requested_revision" > 0),
	CONSTRAINT "job_snapshot" CHECK(json_valid("jobs"."snapshot_json")),
	CONSTRAINT "job_output" CHECK("jobs"."provider_output_json" IS NULL OR json_valid("jobs"."provider_output_json")),
	CONSTRAINT "job_metadata" CHECK("jobs"."actual_metadata_json" IS NULL OR json_valid("jobs"."actual_metadata_json"))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `jobs_provider_request_id_unique` ON `jobs` (`provider_request_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `jobs_output_asset_id_unique` ON `jobs` (`output_asset_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `jobs_request_key` ON `jobs` (`guest_id`,`request_key`);--> statement-breakpoint
CREATE INDEX `jobs_guest_status` ON `jobs` (`guest_id`,`status`);--> statement-breakpoint
CREATE INDEX `jobs_accounting` ON `jobs` (`accounting_state`);--> statement-breakpoint
CREATE INDEX `jobs_project_date` ON `jobs` (`project_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`guest_id` text NOT NULL,
	`title` text NOT NULL,
	`draft_json` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`preferred_asset_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`guest_id`) REFERENCES `guests`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "project_title" CHECK(length("projects"."title") BETWEEN 1 AND 80),
	CONSTRAINT "project_draft" CHECK(json_valid("projects"."draft_json")),
	CONSTRAINT "project_revision" CHECK("projects"."revision" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_owner` ON `projects` (`id`,`guest_id`);--> statement-breakpoint
CREATE INDEX `projects_guest_date` ON `projects` (`guest_id`,`created_at`,`id`);--> statement-breakpoint
CREATE TABLE `rate_buckets` (
	`scope` text NOT NULL,
	`subject` text NOT NULL,
	`window_start` integer NOT NULL,
	`count` integer NOT NULL,
	PRIMARY KEY(`scope`, `subject`, `window_start`),
	CONSTRAINT "rate_count" CHECK("rate_buckets"."count" > 0)
);
--> statement-breakpoint
CREATE TABLE `storage_reservations` (
	`id` text PRIMARY KEY NOT NULL,
	`guest_id` text NOT NULL,
	`project_id` text NOT NULL,
	`asset_id` text NOT NULL,
	`job_id` text,
	`bytes` integer NOT NULL,
	`state` text NOT NULL,
	`content_sha256` text,
	`content_mime_type` text,
	`lease_token` text,
	`lease_expires_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`guest_id`) REFERENCES `guests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`,`guest_id`) REFERENCES `projects`(`id`,`guest_id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "reservation_bytes" CHECK("storage_reservations"."bytes" > 0 AND "storage_reservations"."bytes" <= 20000000),
	CONSTRAINT "reservation_state" CHECK("storage_reservations"."state" IN ('held','stored','released'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `storage_reservations_asset_id_unique` ON `storage_reservations` (`asset_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `storage_reservations_job_id_unique` ON `storage_reservations` (`job_id`);--> statement-breakpoint
CREATE INDEX `storage_guest_state` ON `storage_reservations` (`guest_id`,`state`);--> statement-breakpoint
CREATE INDEX `storage_state` ON `storage_reservations` (`state`);
--> statement-breakpoint
CREATE TRIGGER guests_quota BEFORE INSERT ON guests BEGIN
  SELECT CASE WHEN (SELECT count(*) FROM guests) >= 1000 THEN RAISE(ABORT, 'GUEST_LIMIT') END;
END;
--> statement-breakpoint
CREATE TRIGGER projects_quota BEFORE INSERT ON projects BEGIN
  SELECT CASE WHEN (SELECT count(*) FROM projects) >= 5000 OR
    (SELECT count(*) FROM projects WHERE guest_id = NEW.guest_id) >= 20 THEN RAISE(ABORT, 'RECORD_QUOTA') END;
END;
--> statement-breakpoint
CREATE TRIGGER reservations_quota BEFORE INSERT ON storage_reservations BEGIN
  SELECT CASE WHEN NEW.state != 'held' THEN RAISE(ABORT, 'INVALID_STATE') END;
  SELECT CASE WHEN (SELECT count(*) FROM storage_reservations WHERE state != 'released') >= 500 OR
    (SELECT count(*) FROM storage_reservations WHERE state != 'released' AND guest_id = NEW.guest_id) >= 12 THEN RAISE(ABORT, 'STORAGE_QUOTA') END;
  SELECT CASE WHEN NEW.bytes + COALESCE((SELECT sum(bytes) FROM storage_reservations WHERE state != 'released'),0) > 250000000 OR
    NEW.bytes + COALESCE((SELECT sum(bytes) FROM storage_reservations WHERE state != 'released' AND guest_id = NEW.guest_id),0) > 25000000 THEN RAISE(ABORT, 'STORAGE_QUOTA') END;
END;
--> statement-breakpoint
CREATE TRIGGER reservation_immutable BEFORE UPDATE ON storage_reservations BEGIN
  SELECT CASE WHEN NEW.id != OLD.id OR NEW.guest_id != OLD.guest_id OR NEW.project_id != OLD.project_id OR NEW.asset_id != OLD.asset_id OR NEW.job_id IS NOT OLD.job_id OR
    NEW.bytes > OLD.bytes OR (OLD.state = 'released' AND NEW.state != 'released') OR (OLD.state = 'stored' AND NEW.state = 'held') OR
    (OLD.content_sha256 IS NOT NULL AND NEW.content_sha256 IS NOT OLD.content_sha256) OR
    (OLD.content_mime_type IS NOT NULL AND NEW.content_mime_type IS NOT OLD.content_mime_type) THEN RAISE(ABORT, 'IMMUTABLE_RESERVATION') END;
END;
--> statement-breakpoint
CREATE TRIGGER jobs_admission BEFORE INSERT ON jobs BEGIN
  SELECT CASE WHEN NEW.status != 'prepared' OR NEW.accounting_state != 'held' THEN RAISE(ABORT, 'INVALID_STATE') END;
  SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM projects WHERE id = NEW.project_id AND guest_id = NEW.guest_id AND revision = NEW.requested_revision) THEN RAISE(ABORT, 'REVISION_CONFLICT') END;
  SELECT CASE WHEN (SELECT count(*) FROM jobs) >= 10000 OR
    (SELECT count(*) FROM jobs WHERE guest_id = NEW.guest_id) >= 100 THEN RAISE(ABORT, 'RECORD_QUOTA') END;
  SELECT CASE WHEN EXISTS (SELECT 1 FROM jobs WHERE guest_id = NEW.guest_id AND status IN ('prepared','submitting','submission_unknown','queued','running','storing','transfer_failed')) THEN RAISE(ABORT, 'JOB_ACTIVE') END;
  SELECT CASE WHEN COALESCE((SELECT cap_micro_usd FROM budget_policy WHERE id = 1),0) <= 0 THEN RAISE(ABORT, 'BUDGET_ZERO') END;
  SELECT CASE WHEN NEW.reserve_micro_usd + COALESCE((SELECT sum(reserve_micro_usd) FROM jobs WHERE accounting_state != 'released'),0) > (SELECT cap_micro_usd FROM budget_policy WHERE id = 1) OR
    NEW.reserve_micro_usd + COALESCE((SELECT sum(reserve_micro_usd) FROM jobs WHERE accounting_state != 'released' AND guest_id = NEW.guest_id),0) > 500000 THEN RAISE(ABORT, 'BUDGET_EXHAUSTED') END;
END;
--> statement-breakpoint
CREATE TRIGGER jobs_reserve AFTER INSERT ON jobs BEGIN
  INSERT INTO storage_reservations (id,guest_id,project_id,asset_id,job_id,bytes,state,created_at,updated_at)
  VALUES (NEW.id,NEW.guest_id,NEW.project_id,NEW.id,NEW.id,
    CASE json_extract(NEW.snapshot_json,'$.operation') WHEN 'text_to_image' THEN 5000000 ELSE 20000000 END,'held',NEW.created_at,NEW.created_at);
END;
--> statement-breakpoint
CREATE TRIGGER jobs_immutable BEFORE UPDATE ON jobs BEGIN
  SELECT CASE WHEN NEW.id != OLD.id OR NEW.guest_id != OLD.guest_id OR NEW.project_id != OLD.project_id OR NEW.request_key != OLD.request_key OR
    NEW.requested_revision != OLD.requested_revision OR NEW.submit_hash != OLD.submit_hash OR NEW.snapshot_json != OLD.snapshot_json OR NEW.reserve_micro_usd != OLD.reserve_micro_usd OR
    (OLD.provider_request_id IS NOT NULL AND NEW.provider_request_id IS NOT OLD.provider_request_id) OR
    (OLD.status != 'prepared' AND NEW.status = 'prepared') OR
    (NEW.accounting_state = 'released' AND OLD.accounting_state != 'released' AND OLD.status != 'prepared') THEN RAISE(ABORT, 'IMMUTABLE_JOB') END;
END;
--> statement-breakpoint
CREATE TRIGGER assets_immutable BEFORE UPDATE ON assets BEGIN
  SELECT RAISE(ABORT, 'IMMUTABLE_ASSET');
END;
--> statement-breakpoint
CREATE TRIGGER assets_reservation BEFORE INSERT ON assets BEGIN
  SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM storage_reservations WHERE asset_id = NEW.id AND guest_id = NEW.guest_id AND project_id = NEW.project_id AND state = 'held' AND bytes >= NEW.byte_size AND job_id IS NEW.source_job_id) THEN RAISE(ABORT, 'INVALID_RESERVATION') END;
END;
--> statement-breakpoint
CREATE TRIGGER assets_settle AFTER INSERT ON assets BEGIN
  UPDATE storage_reservations SET state = 'stored', bytes = NEW.byte_size, content_sha256 = NEW.sha256, content_mime_type = NEW.mime_type,
    lease_token = NULL, lease_expires_at = NULL, updated_at = NEW.created_at WHERE asset_id = NEW.id;
END;
