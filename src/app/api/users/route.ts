import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { count, asc, desc, type AnyColumn } from "drizzle-orm";

const sortableColumns: Record<string, AnyColumn> = {
  id: users.id,
  email: users.email,
  name: users.name,
  role: users.role,
  createdAt: users.createdAt,
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

  let orderBy = desc(users.createdAt);
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
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(orderBy)
      .offset(offset)
      .limit(limit),
    db.select({ total: count() }).from(users),
  ]);

  return NextResponse.json(data, {
    headers: {
      "Content-Range": `users ${offset}-${offset + data.length - 1}/${total}`,
      "Access-Control-Expose-Headers": "Content-Range",
    },
  });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, email, password, role } = body;

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "name, email, and password are required" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [created] = await db
    .insert(users)
    .values({ name, email, passwordHash, role: role || "user" })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    });

  return NextResponse.json(created, { status: 201 });
}
