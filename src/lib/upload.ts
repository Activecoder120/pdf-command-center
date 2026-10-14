import { MAX_FILES, MAX_TOTAL_BYTES } from "./pdf-types.ts";

export type UploadKind = "pdf" | "image";
export function uploadLimit(raw?: string): number {
  const mb = Number(raw ?? 50);
  return Number.isFinite(mb) && mb > 0 && mb <= 100 ? mb * 1024 * 1024 : 50 * 1024 * 1024;
}
export const MAX_UPLOAD_BYTES = uploadLimit(import.meta.env?.VITE_MAX_UPLOAD_MB);

export async function validateUpload(file: File, kind: UploadKind, limit = MAX_UPLOAD_BYTES) {
  if (!file.size) throw new Error(`${file.name}: the file is empty.`);
  if (file.size > limit)
    throw new Error(`${file.name}: maximum file size is ${limit / 1024 / 1024} MB.`);
  const bytes = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  const pdf = [37, 80, 68, 70, 45].every((b, i) => bytes[i] === b);
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b);
  const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (kind === "pdf" && (!pdf || !/\.pdf$/i.test(file.name))) {
    throw new Error(`${file.name}: select a valid PDF file with a %PDF- signature.`);
  }
  if (
    kind === "image" &&
    !((png && /\.png$/i.test(file.name)) || (jpg && /\.jpe?g$/i.test(file.name)))
  ) {
    throw new Error(`${file.name}: only valid PNG and JPG images are supported.`);
  }
  if (kind === "image" && png) {
    if (bytes.length < 24) throw new Error(`${file.name}: incomplete PNG header.`);
    const view = new DataView(bytes.buffer);
    const width = view.getUint32(16),
      height = view.getUint32(20);
    if (!width || !height || width * height > 16_000_000)
      throw new Error(
        `${file.name}: images are limited to 16 million pixels. Resize the image first.`,
      );
  }
}

export function validateBatch(files: File[], multiple: boolean) {
  if (!files.length) throw new Error("Select at least one file.");
  if (!multiple && files.length !== 1) throw new Error("This tool accepts one PDF at a time.");
  if (files.length > MAX_FILES) throw new Error(`Select no more than ${MAX_FILES} files.`);
  if (files.reduce((total, file) => total + file.size, 0) > MAX_TOTAL_BYTES) {
    throw new Error("Combined files must be 100 MB or smaller.");
  }
}

export function fileSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
