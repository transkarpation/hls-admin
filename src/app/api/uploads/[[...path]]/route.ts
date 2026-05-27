import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import { auth } from "@/auth";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

const MIME_TYPES: Record<string, string> = {
  ".m3u8": "application/vnd.apple.mpegurl",
  ".ts": "video/mp2t",
  ".mp4": "video/mp4",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const segments = (await params).path;
  if (!segments || segments.length === 0)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const filePath = path.join(UPLOAD_ROOT, ...segments);
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(UPLOAD_ROOT))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await stat(resolved);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = path.extname(resolved).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const data = await readFile(resolved);

  return new NextResponse(data, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
