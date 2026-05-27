import { Queue } from "bullmq";

const connection = {
  host: new URL(process.env.REDIS_URL || "redis://localhost:6379").hostname,
  port: Number(new URL(process.env.REDIS_URL || "redis://localhost:6379").port) || 6379,
};

export const videoQueue = new Queue("video", { connection });
