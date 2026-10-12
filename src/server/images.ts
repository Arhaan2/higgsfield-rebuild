import { Fault } from "./http";
export type ImageInfo = { mimeType: "image/jpeg" | "image/png"; width: number; height: number };
const invalid = (): never => { throw new Fault(422,"INVALID_IMAGE","Use a complete JPEG or non-animated PNG, 256–4,096 pixels per side and at most 16 million pixels."); };
function dimensions(width: number,height: number) { if (width < 256 || height < 256 || width > 4096 || height > 4096 || width*height > 16000000) invalid(); return { width,height }; }
function crc32(bytes: Uint8Array, start: number, end: number) {
  let c = 0xffffffff;
  for (let i=start;i<end;i++) { c ^= bytes[i]; for (let b=0;b<8;b++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); }
  return (c ^ 0xffffffff) >>> 0;
}
export function validateImage(bytes: Uint8Array, mime: string): ImageInfo {
  const v = new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  if (mime === "image/png") {
    if (bytes.length < 57 || ![137,80,78,71,13,10,26,10].every((b,i) => bytes[i] === b)) invalid();
    let offset=8, width=0, height=0, sawData=false, endedData=false, palette=false, dataBytes=0;
    while (offset+12 <= bytes.length) {
      const len = v.getUint32(offset); const end = offset+12+len; if (end > bytes.length) invalid();
      const type = String.fromCharCode(...bytes.subarray(offset+4,offset+8));
      if (!/^[A-Za-z]{4}$/.test(type) || v.getUint32(offset+8+len) !== crc32(bytes,offset+4,offset+8+len)) invalid();
      if (offset === 8 && (type !== "IHDR" || len !== 13)) invalid();
      if (type === "IHDR") {
        if (offset !== 8 || len !== 13) invalid();
        width = v.getUint32(offset+8); height = v.getUint32(offset+12);
        const depth=bytes[offset+16], color=bytes[offset+17];
        const depths: Record<number,number[]> = {0:[1,2,4,8,16],2:[8,16],3:[1,2,4,8],4:[8,16],6:[8,16]};
        if (!depths[color]?.includes(depth) || bytes[offset+18] || bytes[offset+19] || bytes[offset+20] > 1) invalid();
      } else if (["acTL","fcTL","fdAT"].includes(type)) invalid();
      else if (type === "PLTE") { if (sawData || !len || len % 3 || len > 768) invalid(); palette=true; }
      else if (type === "IDAT") { if (endedData || (bytes[25] === 3 && !palette)) invalid(); sawData=true; dataBytes+=len; }
      else if (type === "IEND") { if (len || (!sawData || dataBytes < 6) || end !== bytes.length) invalid(); return { mimeType:mime,...dimensions(width,height) }; }
      else { if (sawData) endedData=true; if (type[0] === type[0].toUpperCase()) invalid(); }
      offset=end;
    }
    invalid();
  }
  if (mime !== "image/jpeg" || bytes.length < 20 || bytes[0] !== 255 || bytes[1] !== 216) invalid();
  let at=2, width=0,height=0, scanned=false;
  while (at < bytes.length) {
    if (bytes[at++] !== 255) invalid(); while (bytes[at] === 255) at++;
    const marker=bytes[at++];
    if (marker === 217) { if (!width || !scanned || at !== bytes.length) invalid(); return { mimeType:"image/jpeg",...dimensions(width,height) }; }
    if (marker === 0 || marker === 216 || marker === 1 || (marker >= 208 && marker <= 215) || at+2 > bytes.length) invalid();
    const len=v.getUint16(at); if (len < 2 || at+len > bytes.length) invalid();
    if ([192,193,194].includes(marker)) {
      if (width || len < 11 || bytes[at+2] !== 8 || len !== 8+3*bytes[at+7] || ![1,3,4].includes(bytes[at+7])) invalid();
      height=v.getUint16(at+3); width=v.getUint16(at+5);
    } else if (marker >= 192 && marker <= 207 && ![196,200,204].includes(marker)) invalid();
    if (marker === 218) {
      if (!width || len < 6 || len !== 6+2*bytes[at+2]) invalid(); scanned=true; at+=len;
      // Entropy data: FF00 is escaped FF, restart markers have no payload.
      while (at < bytes.length) {
        if (bytes[at] !== 255) { at++; continue; }
        if (bytes[at+1] === 0 || (bytes[at+1] >= 208 && bytes[at+1] <= 215)) { at+=2; continue; }
        break;
      }
    } else at+=len;
  }
  return invalid();
}
export function fileName(value: string | null, mime: string) {
  if (!value || [...value].length > 120 || /[\\/\x00-\x1f\x7f]/.test(value) || !value.trim()) throw new Fault(422,"VALIDATION_FAILED","Use a filename without paths or control characters.");
  if (!(mime === "image/png" ? /\.png$/i : /\.jpe?g$/i).test(value)) throw new Fault(422,"INVALID_IMAGE","The filename extension must match the image type.");
  return value.trim();
}
