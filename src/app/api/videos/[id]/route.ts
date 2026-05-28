import { NextRequest, NextResponse } from "next/server";
import { rm } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const [video] = await db
    .select({
      id: videos.id,
      title: videos.title,
      description: videos.description,
      filename: videos.filename,
      filePath: videos.filePath,
      hlsPath: videos.hlsPath,
      subtitlesPath: videos.subtitlesPath,
      status: videos.status,
      fileSize: videos.fileSize,
      mimeType: videos.mimeType,
      createdAt: videos.createdAt,
    })
    .from(videos)
    .where(eq(videos.id, id))
    .limit(1);

  if (!video)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(video);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const [deleted] = await db
    .delete(videos)
    .where(eq(videos.id, id))
    .returning({
      id: videos.id,
      title: videos.title,
      filePath: videos.filePath,
      hlsPath: videos.hlsPath,
    });

  if (!deleted)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const root = process.cwd();
  if (deleted.filePath) {
    rm(path.join(root, deleted.filePath), { force: true }).catch(() => {});
  }
  if (deleted.hlsPath) {
    rm(path.join(root, deleted.hlsPath), { recursive: true, force: true }).catch(() => {});
  }

  return NextResponse.json({ id: deleted.id, title: deleted.title });
}
