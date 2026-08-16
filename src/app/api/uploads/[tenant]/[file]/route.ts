import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { UPLOADS_DIR } from "@/lib/uploads";

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

const SAFE = /^[A-Za-z0-9.-]+$/;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tenant: string; file: string }> },
) {
  const { tenant, file } = await params;
  const ext = file.split(".").pop()?.toLowerCase() ?? "";
  const mime = MIME_BY_EXT[ext];
  if (!mime || !SAFE.test(tenant) || !SAFE.test(file)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const tenantDir = path.join(UPLOADS_DIR, tenant);
  const filePath = path.join(tenantDir, file);
  if (!filePath.startsWith(tenantDir)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  try {
    const data = await readFile(filePath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}