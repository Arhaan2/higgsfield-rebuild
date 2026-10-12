-- SCHEMA ONLY. Coordinator appends to first Drizzle migration before application.
-- A D1 statement and its triggers are atomic; no network operation belongs here.
CREATE TRIGGER guests_quota BEFORE INSERT ON guests BEGIN
  SELECT CASE WHEN (SELECT count(*) FROM guests) >= 1000 THEN RAISE(ABORT, 'GUEST_LIMIT') END;
END;
CREATE TRIGGER projects_quota BEFORE INSERT ON projects BEGIN
  SELECT CASE WHEN (SELECT count(*) FROM projects) >= 5000 OR
    (SELECT count(*) FROM projects WHERE guest_id = NEW.guest_id) >= 20 THEN RAISE(ABORT, 'RECORD_QUOTA') END;
END;
CREATE TRIGGER reservations_quota BEFORE INSERT ON storage_reservations BEGIN
  SELECT CASE WHEN NEW.state != 'held' THEN RAISE(ABORT, 'INVALID_STATE') END;
  SELECT CASE WHEN (SELECT count(*) FROM storage_reservations WHERE state != 'released') >= 500 OR
    (SELECT count(*) FROM storage_reservations WHERE state != 'released' AND guest_id = NEW.guest_id) >= 12 THEN RAISE(ABORT, 'STORAGE_QUOTA') END;
  SELECT CASE WHEN NEW.bytes + COALESCE((SELECT sum(bytes) FROM storage_reservations WHERE state != 'released'),0) > 250000000 OR
    NEW.bytes + COALESCE((SELECT sum(bytes) FROM storage_reservations WHERE state != 'released' AND guest_id = NEW.guest_id),0) > 25000000 THEN RAISE(ABORT, 'STORAGE_QUOTA') END;
END;
CREATE TRIGGER reservation_immutable BEFORE UPDATE ON storage_reservations BEGIN
  SELECT CASE WHEN NEW.id != OLD.id OR NEW.guest_id != OLD.guest_id OR NEW.project_id != OLD.project_id OR NEW.asset_id != OLD.asset_id OR NEW.job_id IS NOT OLD.job_id OR
    NEW.bytes > OLD.bytes OR (OLD.state = 'released' AND NEW.state != 'released') OR (OLD.state = 'stored' AND NEW.state = 'held') OR
    (OLD.content_sha256 IS NOT NULL AND NEW.content_sha256 IS NOT OLD.content_sha256) OR
    (OLD.content_mime_type IS NOT NULL AND NEW.content_mime_type IS NOT OLD.content_mime_type) THEN RAISE(ABORT, 'IMMUTABLE_RESERVATION') END;
END;
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
CREATE TRIGGER jobs_reserve AFTER INSERT ON jobs BEGIN
  INSERT INTO storage_reservations (id,guest_id,project_id,asset_id,job_id,bytes,state,created_at,updated_at)
  VALUES (NEW.id,NEW.guest_id,NEW.project_id,NEW.id,NEW.id,
    CASE json_extract(NEW.snapshot_json,'$.operation') WHEN 'text_to_image' THEN 5000000 ELSE 20000000 END,'held',NEW.created_at,NEW.created_at);
END;
CREATE TRIGGER jobs_immutable BEFORE UPDATE ON jobs BEGIN
  SELECT CASE WHEN NEW.id != OLD.id OR NEW.guest_id != OLD.guest_id OR NEW.project_id != OLD.project_id OR NEW.request_key != OLD.request_key OR
    NEW.requested_revision != OLD.requested_revision OR NEW.submit_hash != OLD.submit_hash OR NEW.snapshot_json != OLD.snapshot_json OR NEW.reserve_micro_usd != OLD.reserve_micro_usd OR
    (OLD.provider_request_id IS NOT NULL AND NEW.provider_request_id IS NOT OLD.provider_request_id) OR
    (OLD.status != 'prepared' AND NEW.status = 'prepared') OR
    (NEW.accounting_state = 'released' AND OLD.accounting_state != 'released' AND OLD.status != 'prepared') THEN RAISE(ABORT, 'IMMUTABLE_JOB') END;
END;
CREATE TRIGGER assets_immutable BEFORE UPDATE ON assets BEGIN
  SELECT RAISE(ABORT, 'IMMUTABLE_ASSET');
END;
CREATE TRIGGER assets_reservation BEFORE INSERT ON assets BEGIN
  SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM storage_reservations WHERE asset_id = NEW.id AND guest_id = NEW.guest_id AND project_id = NEW.project_id AND state = 'held' AND bytes >= NEW.byte_size AND job_id IS NEW.source_job_id) THEN RAISE(ABORT, 'INVALID_RESERVATION') END;
END;
CREATE TRIGGER assets_settle AFTER INSERT ON assets BEGIN
  UPDATE storage_reservations SET state = 'stored', bytes = NEW.byte_size, content_sha256 = NEW.sha256, content_mime_type = NEW.mime_type,
    lease_token = NULL, lease_expires_at = NULL, updated_at = NEW.created_at WHERE asset_id = NEW.id;
END;
