import path from "node:path";
import { unlink } from "node:fs/promises";

export const UPLOADS_DIR = path.join(process.cwd(), "uploads");

const UPLOAD_RE =
  /^\/api\/uploads\/([^/]+)\/([A-Za-z0-9-]+\.(?:jpg|jpeg|png|webp|gif))$/;

export function isValidUploadUrl(
  url: string | null | undefined,
  tenantId: string,
): boolean {
  if (!url) return false;
  const match = UPLOAD_RE.exec(url);
  return !!match && match[1] === tenantId;
}

export function uploadPathFromUrl(
  url: string | null | undefined,
  tenantId: string,
): string | null {
  if (url === null || url === undefined) return null;
  if (!isValidUploadUrl(url, tenantId)) return null;
  const match = UPLOAD_RE.exec(url)!;
  return path.join(UPLOADS_DIR, match[1], match[2]);
}

export async function removeUpload(
  url: string | null | undefined,
  tenantId: string,
): Promise<void> {
  const filePath = uploadPathFromUrl(url, tenantId);
  if (!filePath) return;
  try {
    await unlink(filePath);
  } catch {
    // el archivo puede no existir (ENOENT); no debe propagarse
  }
}