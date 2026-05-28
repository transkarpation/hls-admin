import { Worker } from "bullmq";
import { execFile } from "child_process";
import { createReadStream } from "fs";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import OpenAI from "openai";
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
      const { videoId, filePath, transcribe } = job.data;
      console.log(`[video-worker] Processing job ${job.id} for video ${videoId}`);

      await db
        .update(videos)
        .set({ status: "processing", updatedAt: new Date() })
        .where(eq(videos.id, videoId));

      const inputPath = path.join(process.cwd(), filePath);
      const hlsDir = path.join(process.cwd(), "uploads", "videos", videoId);
      await mkdir(hlsDir, { recursive: true });

      let subtitlesRelativePath: string | undefined;

      if (transcribe) {
        const audioPath = path.join(hlsDir, "audio.wav");
        console.log(`[video-worker] Extracting audio for transcription: ${videoId}`);
        await ffmpeg([
          "-i", inputPath,
          "-vn",
          "-acodec", "pcm_s16le",
          "-ar", "16000",
          "-ac", "1",
          audioPath,
        ]);
        console.log(`[video-worker] Audio extracted, transcribing: ${videoId}`);

        const openai = new OpenAI();
        const transcription = await openai.audio.transcriptions.create({
          file: createReadStream(audioPath),
          model: "whisper-1",
          response_format: "verbose_json",
          timestamp_granularities: ["segment"],
        });

        console.log(`[video-worker] Transcription done: lang=${transcription.language}, duration=${transcription.duration}s`);

        const segments = transcription.segments ?? [];
        const fmt = (s: number, msSep: string) => {
          const h = Math.floor(s / 3600);
          const m = Math.floor((s % 3600) / 60);
          const sec = Math.floor(s % 60);
          const ms = Math.round((s % 1) * 1000);
          return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}${msSep}${String(ms).padStart(3, "0")}`;
        };

        const cues = segments.map(
          (seg, i) => ({ i: i + 1, start: seg.start, end: seg.end, text: seg.text.trim() })
        );

        const srt = cues
          .map((c) => `${c.i}\n${fmt(c.start, ",")} --> ${fmt(c.end, ",")}\n${c.text}`)
          .join("\n\n");
        await writeFile(path.join(hlsDir, "subtitles.srt"), srt + "\n");

        const vtt =
          "WEBVTT\n\n" +
          cues
            .map((c) => `${c.i}\n${fmt(c.start, ".")} --> ${fmt(c.end, ".")}\n${c.text}`)
            .join("\n\n");
        await writeFile(path.join(hlsDir, "subtitles.vtt"), vtt + "\n");

        subtitlesRelativePath = `uploads/videos/${videoId}/subtitles.vtt`;
        console.log(`[video-worker] Written ${cues.length} subtitles for ${videoId}`);
      }

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
        .set({
          status: "ready",
          hlsPath: hlsRelativePath,
          ...(subtitlesRelativePath && { subtitlesPath: subtitlesRelativePath }),
          updatedAt: new Date(),
        })
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
