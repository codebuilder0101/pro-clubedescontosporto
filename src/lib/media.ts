import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Offer photos live on the VPS disk (decision 2026-10-09), outside the repo so
// deploys never touch them. Each upload is stored twice as WebP: a large
// version (max 1600 px wide) and a thumbnail (640 px). They are served only to
// members and admins by /api/media/offers/[file].

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const FILE_NAME = /^[a-z0-9-]+(-thumb)?\.webp$/;

export function uploadDir(): string {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
}

function offerDir() {
  return path.join(uploadDir(), "offers");
}

/** Absolute path of a stored file, or null if the name isn't one we generate. */
export function offerImagePath(fileName: string): string | null {
  return FILE_NAME.test(fileName) ? path.join(offerDir(), fileName) : null;
}

export function thumbName(fileName: string): string {
  return fileName.replace(/\.webp$/, "-thumb.webp");
}

export function offerImageUrls(fileName: string) {
  return { src: `/api/media/offers/${fileName}`, thumb: `/api/media/offers/${thumbName(fileName)}` };
}

export type UploadError = "imageType" | "imageSize" | "imageInvalid";

/** Validates, normalises (EXIF rotation, size) and stores an uploaded image. */
export async function saveOfferImage(file: File): Promise<{ fileName: string; width: number; height: number } | { error: UploadError }> {
  if (!ACCEPTED_TYPES.has(file.type)) return { error: "imageType" };
  if (file.size > MAX_UPLOAD_BYTES) return { error: "imageSize" };

  const input = Buffer.from(await file.arrayBuffer());
  try {
    const base = sharp(input, { limitInputPixels: 40_000_000 }).rotate();
    const large = await base
      .clone()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    const thumb = await base.clone().resize({ width: 640, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();

    const fileName = `${randomUUID()}.webp`;
    await mkdir(offerDir(), { recursive: true });
    await writeFile(path.join(offerDir(), fileName), large.data);
    await writeFile(path.join(offerDir(), thumbName(fileName)), thumb);
    return { fileName, width: large.info.width, height: large.info.height };
  } catch {
    return { error: "imageInvalid" };
  }
}

export async function deleteOfferImageFiles(fileName: string) {
  const main = offerImagePath(fileName);
  if (!main) return;
  await rm(main, { force: true });
  await rm(path.join(offerDir(), thumbName(fileName)), { force: true });
}
