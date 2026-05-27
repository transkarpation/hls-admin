import { Worker } from "bullmq";
import { execFile } from "child_process";
import { mkdir } from "fs/promises";
import path from "path";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { eq } from "drizzle-orm";

const connection = {
  host: new URL(process.env.REDIS_URL || "redis://localhost:6379").hostname,
  port: Number(new URL(process.env.REDIS_URL || "redis://localhost:6379").port) || 6379,
};

function ffmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = execFile("ffmpeg", args, { maxBuffer: 10 * 1024 * 1024 }, (err) => {
      if (err) reject(err);
      else resolve();
    });
    proc.stderr?.on("data", (data: Buffer) => {
      console.log("[ffmpeg]", data.toString().trim());
    });
  });
}

export function startVideoWorker() {
  const worker = new Worker(
    "video",
    async (job) => {
      const { videoId, filePath } = job.data;
      console.log(`[video-worker] Processing job ${job.id} for video ${videoId}`);

      await db
        .update(videos)
        .set({ status: "processing", updatedAt: new Date() })
        .where(eq(videos.id, videoId));

      const inputPath = path.join(process.cwd(), filePath);
      const hlsDir = path.join(process.cwd(), "uploads", "videos", videoId);
      await mkdir(hlsDir, { recursive: true });

      const outputPath = path.join(hlsDir, "index.m3u8");

      await ffmpeg([
        "-i", inputPath,
        "-codec:", "copy",
        "-start_number", "0",
        "-hls_time", "10",
        "-hls_list_size", "0",
        "-f", "hls",
        outputPath,
      ]);

      const hlsRelativePath = `uploads/videos/${videoId}/index.m3u8`;

      await db
        .update(videos)
        .set({ status: "ready", hlsPath: hlsRelativePath, updatedAt: new Date() })
        .where(eq(videos.id, videoId));

      console.log(`[video-worker] Video ${videoId} transcoded to HLS`);
      return { hlsPath: hlsRelativePath };
    },
    {
      connection,
      concurrency: 2,
    }
  );

  worker.on("failed", async (job, err) => {
    console.error(`[video-worker] Job ${job?.id} failed:`, err.message);
    if (job) {
      await db
        .update(videos)
        .set({ status: "failed", updatedAt: new Date() })
        .where(eq(videos.id, job.data.videoId));
    }
  });

  worker.on("completed", (job) => {
    console.log(`[video-worker] Job ${job.id} completed`);
  });

  console.log("[video-worker] Worker started");
  return worker;
}
