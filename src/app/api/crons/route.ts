import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { cronJobs } from "@/db/schema";
import { count, asc, desc, type AnyColumn } from "drizzle-orm";
import { scheduleJob } from "@/lib/scheduler";
import cron from "node-cron";

const SCRIPTS_DIR = path.join(process.cwd(), "uploads", "cron-scripts");

const sortableColumns: Record<string, AnyColumn> = {
  id: cronJobs.id,
  name: cronJobs.name,
  createdAt: cronJobs.createdAt,
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

  let orderBy = desc(cronJobs.createdAt);
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
        id: cronJobs.id,
        name: cronJobs.name,
        expression: cronJobs.expression,
        command: cronJobs.command,
        scriptFilename: cronJobs.scriptFilename,
        enabled: cronJobs.enabled,
        lastRunAt: cronJobs.lastRunAt,
        createdAt: cronJobs.createdAt,
      })
      .from(cronJobs)
      .orderBy(orderBy)
      .offset(offset)
      .limit(limit),
    db.select({ total: count() }).from(cronJobs),
  ]);

  return NextResponse.json(data, {
    headers: {
      "Content-Range": `crons ${offset}-${offset + data.length - 1}/${total}`,
      "Access-Control-Expose-Headers": "Content-Range",
    },
  });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const contentType = req.headers.get("content-type") || "";
  const isFormData = contentType.includes("multipart/form-data");

  let name: string;
  let expression: string;
  let command: string | null = null;
  let scriptPath: string | null = null;
  let scriptFilename: string | null = null;
  let enabled = true;

  if (isFormData) {
    const formData = await req.formData();
    name = formData.get("name") as string;
    expression = formData.get("expression") as string;
    command = (formData.get("command") as string) || null;
    enabled = formData.get("enabled") !== "false";

    const script = formData.get("script") as File | null;
    if (script && script.size > 0) {
      await mkdir(SCRIPTS_DIR, { recursive: true });
      const safeName = `${Date.now()}-${crypto.randomUUID()}.js`;
      const fullPath = path.join(SCRIPTS_DIR, safeName);
      const buffer = Buffer.from(await script.arrayBuffer());
      await writeFile(fullPath, buffer);
      scriptPath = `uploads/cron-scripts/${safeName}`;
      scriptFilename = script.name;
    }
  } else {
    const body = await req.json();
    name = body.name;
    expression = body.expression;
    command = body.command || null;
    enabled = body.enabled ?? true;
  }

  if (!name || !expression) {
    return NextResponse.json(
      { error: "name and expression are required" },
      { status: 400 }
    );
  }

  if (!command && !scriptPath) {
    return NextResponse.json(
      { error: "Either command or script file is required" },
      { status: 400 }
    );
  }

  if (!cron.validate(expression)) {
    return NextResponse.json(
      { error: `Invalid cron expression: ${expression}` },
      { status: 400 }
    );
  }

  const [created] = await db
    .insert(cronJobs)
    .values({ name, expression, command, scriptPath, scriptFilename, enabled })
    .returning({
      id: cronJobs.id,
      name: cronJobs.name,
      expression: cronJobs.expression,
      command: cronJobs.command,
      scriptFilename: cronJobs.scriptFilename,
      enabled: cronJobs.enabled,
      lastRunAt: cronJobs.lastRunAt,
      createdAt: cronJobs.createdAt,
    });

  if (created.enabled) {
    scheduleJob(created.id, created.expression, {
      command: created.command,
      scriptPath,
    });
  }

  return NextResponse.json(created, { status: 201 });
}
