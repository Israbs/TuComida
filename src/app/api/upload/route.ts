import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/lib/auth";
import { removeUpload, UPLOADS_DIR } from "@/lib/uploads";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Solo imágenes JPG, PNG, WEBP o GIF" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "La imagen supera los 5 MB" }, { status: 400 });
  }

  const ext = file.type === "image/jpeg" ? "jpg" : file.type.replace("image/", "");
  const filename = `${randomUUID()}.${ext}`;
  const tenantDir = path.join(UPLOADS_DIR, session.user.tenantId);
  await mkdir(tenantDir, { recursive: true });
  await writeFile(path.join(tenantDir, filename), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ url: `/api/uploads/${session.user.tenantId}/${filename}` });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { url?: string };
  if (!body.url) {
    return NextResponse.json({ error: "Falta la URL" }, { status: 400 });
  }
  await removeUpload(body.url, session.user.tenantId);
  return NextResponse.json({ ok: true });
}