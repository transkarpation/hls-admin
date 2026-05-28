import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { count, asc, desc, type AnyColumn } from "drizzle-orm";
import { videoQueue } from "@/lib/videoQueue";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "videos");

const sortableColumns: Record<string, AnyColumn> = {
  id: videos.id,
  title: videos.title,
  createdAt: videos.createdAt,
};

export async function GET(req: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = req.nextUrl;
  const rangeHeader = url.searchParams.get("range");
  const sortHeader = url.searchParams.get("sort");

  let offset = 0;
  let limit = 25;
  if (rangeHeader) {
    const [start, end] = JSON.parse(rangeHeader) as [number, number];
    offset = start;
    limit = end - start + 1;
  }

  let orderBy = desc(videos.createdAt);
  if (sortHeader) {
    const [field, direction] = JSON.parse(sortHeader) as [string, string];
    const column = sortableColumns[field];
    if (column) {
      orderBy = direction === "ASC" ? asc(column) : desc(column);
    }
  }

  const [data, [{ total }]] = await Promise.all([
    db
      .select({
        id: videos.id,
        title: videos.title,
        description: videos.description,
        filename: videos.filename,
        fileSize: videos.fileSize,
        mimeType: videos.mimeType,
        status: videos.status,
        hlsPath: videos.hlsPath,
        subtitlesPath: videos.subtitlesPath,
        createdAt: videos.createdAt,
      })
      .from(videos)
      .orderBy(orderBy)
      .offset(offset)
      .limit(limit),
    db.select({ total: count() }).from(videos),
  ]);

  return NextResponse.json(data, {
    headers: {
      "Content-Range": `videos ${offset}-${offset + data.length - 1}/${total}`,
      "Access-Control-Expose-Headers": "Content-Range",
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const file = formData.get("file") as File | null;
  const transcribe = formData.get("transcribe") === "true";

  if (!title || !file) {
    return NextResponse.json(
      { error: "title and file are required" },
      { status: 400 }
    );
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = path.extname(file.name);
  const safeName = `${Date.now()}-${crypto.randomUUID()}${ext}`;
  const filePath = path.join(UPLOAD_DIR, safeName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const [created] = await db
    .insert(videos)
    .values({
      title,
      description,
      filename: file.name,
      filePath: `uploads/videos/${safeName}`,
      fileSize: file.size,
      mimeType: file.type,
      transcribe,
      uploadedBy: session.user.id,
    })
    .returning({
      id: videos.id,
      title: videos.title,
      description: videos.description,
      filename: videos.filename,
      fileSize: videos.fileSize,
      mimeType: videos.mimeType,
      createdAt: videos.createdAt,
    });

  await videoQueue.add("transcode", {
    videoId: created.id,
    filePath: `uploads/videos/${safeName}`,
    filename: file.name,
    mimeType: file.type,
    transcribe,
  });

  return NextResponse.json(created, { status: 201 });
}
