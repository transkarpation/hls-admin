import cron, { type ScheduledTask } from "node-cron";
import { exec } from "child_process";
import path from "path";
import { db } from "@/db";
import { cronJobs } from "@/db/schema";
import { eq } from "drizzle-orm";

const activeTasks = new Map<string, ScheduledTask>();

function runCommand(jobId: string, command: string) {
  exec(command, async (error, stdout, stderr) => {
    const timestamp = new Date().toISOString();
    if (error) {
      console.error(`[cron ${jobId}] ${timestamp} error:`, stderr);
    } else {
      console.log(`[cron ${jobId}] ${timestamp} output:`, stdout.trim());
    }
    await db
      .update(cronJobs)
      .set({ lastRunAt: new Date() })
      .where(eq(cronJobs.id, jobId));
  });
}

export function scheduleJob(
  id: string,
  expression: string,
  opts: { command?: string | null; scriptPath?: string | null }
) {
  stopJob(id);

  if (!cron.validate(expression)) {
    throw new Error(`Invalid cron expression: ${expression}`);
  }

  let cmd: string;
  if (opts.scriptPath) {
    const abs = path.resolve(process.cwd(), opts.scriptPath);
    cmd = `node ${abs}`;
  } else if (opts.command) {
    cmd = opts.command;
  } else {
    throw new Error("Either command or scriptPath is required");
  }

  const task = cron.schedule(expression, () => runCommand(id, cmd));
  activeTasks.set(id, task);
  console.log(`[scheduler] started job ${id}: "${expression}" → ${cmd}`);
}

export function stopJob(id: string) {
  const existing = activeTasks.get(id);
  if (existing) {
    existing.stop();
    activeTasks.delete(id);
    console.log(`[scheduler] stopped job ${id}`);
  }
}

export async function restoreJobs() {
  const jobs = await db
    .select()
    .from(cronJobs)
    .where(eq(cronJobs.enabled, true));

  for (const job of jobs) {
    try {
      scheduleJob(job.id, job.expression, {
        command: job.command,
        scriptPath: job.scriptPath,
      });
    } catch (e) {
      console.error(`[scheduler] failed to restore job ${job.id}:`, e);
    }
  }
  console.log(`[scheduler] restored ${jobs.length} jobs`);
}
