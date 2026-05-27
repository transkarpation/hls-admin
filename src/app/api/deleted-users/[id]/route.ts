import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { users, videos } from "@/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      deletedAt: users.deletedAt,
    })
    .from(users)
    .where(and(eq(users.id, id), isNotNull(users.deletedAt)))
    .limit(1);

  if (!user)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(user);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await db
    .update(videos)
    .set({ uploadedBy: null })
    .where(eq(videos.uploadedBy, id));
  const [deleted] = await db
    .delete(users)
    .where(and(eq(users.id, id), isNotNull(users.deletedAt)))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    });

  if (!deleted)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(deleted);
}

export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const [restored] = await db
    .update(users)
    .set({ deletedAt: null })
    .where(and(eq(users.id, id), isNotNull(users.deletedAt)))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    });

  if (!restored)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(restored);
}
