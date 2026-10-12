import { UPLOAD_LIMIT } from "../contracts/studio";
import { boundedBytes, Fault, keyFor, sha256, uncompressed, uuid } from "./http";
import { validateImage, fileName } from "./images";
import { one, stmt, type Runtime, type AssetRow, type Reservation } from "./store";
export async function upload(rt:Runtime,request:Request,owner:string,project:string) {
  uncompressed(request); const url=new URL(request.url),id=uuid(url.searchParams.get("assetId") || ""),mime=request.headers.get("Content-Type") || "";
  if (mime!=="image/jpeg" && mime!=="image/png") throw new Fault(415,"UNSUPPORTED_MEDIA_TYPE","Upload a JPEG or PNG image.");
  const filename=fileName(url.searchParams.get("filename"),mime);
  const bytes=await boundedBytes(request.body,UPLOAD_LIMIT,request.headers.get("Content-Length"));
  const info=validateImage(bytes,mime),hash=await sha256(bytes),now=rt.now(),lease=crypto.randomUUID();
  const existing=await one<AssetRow>(rt,"SELECT * FROM assets WHERE id = ? AND guest_id = ?",id,owner);
  const conflict=()=>new Fault(409,"UPLOAD_CONFLICT","This upload ID already belongs to different content. Start a new upload.");
  if (existing) { if (existing.project_id!==project || existing.sha256!==hash || existing.mime_type!==mime) throw conflict(); return {asset:existing,created:false}; }
  let reservation=await one<Reservation>(rt,"SELECT * FROM storage_reservations WHERE asset_id = ? AND guest_id = ?",id,owner);
  if (!reservation) {
    try {
      await stmt(rt,`INSERT INTO storage_reservations (id,guest_id,project_id,asset_id,bytes,state,content_sha256,content_mime_type,lease_token,lease_expires_at,created_at,updated_at)
        VALUES (?,?,?,?,?,'held',?,?,?,?,?,?)`,id,owner,project,id,bytes.length,hash,mime,lease,now+60000,now,now).run();
      reservation=await one<Reservation>(rt,"SELECT * FROM storage_reservations WHERE asset_id = ? AND guest_id = ?",id,owner);
    } catch (error) {
      reservation=await one<Reservation>(rt,"SELECT * FROM storage_reservations WHERE asset_id = ? AND guest_id = ?",id,owner);
      if (!reservation) { if (String(error).includes("UNIQUE")) throw conflict(); throw error; }
    }
  }
  if (!reservation || reservation.project_id!==project || reservation.job_id || reservation.content_sha256!==hash || reservation.content_mime_type!==mime || reservation.state==="released") throw conflict();
  if (reservation.lease_token!==lease) {
    const acquired=await stmt(rt,`UPDATE storage_reservations SET lease_token=?,lease_expires_at=?,updated_at=?
      WHERE id=? AND guest_id=? AND state='held' AND (lease_expires_at IS NULL OR lease_expires_at <= ?)`,lease,now+60000,now,reservation.id,owner,now).run();
    if (!acquired.meta.changes) throw new Fault(409,"UPLOAD_PENDING","This upload is still being retained. Retry the same file shortly.",undefined,3);
  }
  const key=keyFor(owner,id);
  try {
    let object=await rt.bucket.head(key);
    if (!object) object=await rt.bucket.put(key,bytes,{onlyIf:{etagDoesNotMatch:"*"},httpMetadata:{contentType:mime},customMetadata:{sha256:hash,assetId:id}});
    if (!object) object=await rt.bucket.head(key);
    if (!object || object.size!==bytes.length || object.customMetadata?.sha256!==hash || object.httpMetadata?.contentType!==mime) throw conflict();
    const inserted=await stmt(rt,`INSERT INTO assets (id,guest_id,project_id,source,kind,object_key,file_name,mime_type,byte_size,width,height,sha256,created_at)
      SELECT ?,?,?,'upload','image',?,?,?,?,?,?,?,? FROM storage_reservations
      WHERE id=? AND guest_id=? AND state='held' AND lease_token=? AND lease_expires_at > ? RETURNING *`,id,owner,project,key,filename,mime,bytes.length,info.width,info.height,hash,rt.now(),reservation.id,owner,lease,rt.now()).first<AssetRow>();
    if (inserted) return {asset:inserted,created:true};
    const settled=await one<AssetRow>(rt,"SELECT * FROM assets WHERE id=? AND guest_id=?",id,owner);
    if (settled && settled.sha256===hash) return {asset:settled,created:false};
    throw new Fault(409,"UPLOAD_PENDING","The upload is retained but still needs reconciliation. Retry the same file.",undefined,3);
  } catch (error) {
    // Keep bytes/slot counted even when R2 outcome is unknown. Same-byte retry only.
    await stmt(rt,"UPDATE storage_reservations SET lease_expires_at=?,updated_at=? WHERE id=? AND lease_token=? AND state='held'",rt.now(),rt.now(),reservation.id,lease).run();
    throw error;
  }
}
