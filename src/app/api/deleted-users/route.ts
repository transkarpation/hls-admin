import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { count, asc, desc, isNotNull, type AnyColumn } from "drizzle-orm";

const sortableColumns: Record<string, AnyColumn> = {
  id: users.id,
  email: users.email,
  name: users.name,
  role: users.role,
  deletedAt: users.deletedAt,
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

  let orderBy = desc(users.deletedAt);
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
        deletedAt: users.deletedAt,
      })
      .from(users)
      .where(isNotNull(users.deletedAt))
      .orderBy(orderBy)
      .offset(offset)
      .limit(limit),
    db.select({ total: count() }).from(users).where(isNotNull(users.deletedAt)),
  ]);

  return NextResponse.json(data, {
    headers: {
      "Content-Range": `deleted-users ${offset}-${offset + data.length - 1}/${total}`,
      "Access-Control-Expose-Headers": "Content-Range",
    },
  });
}
