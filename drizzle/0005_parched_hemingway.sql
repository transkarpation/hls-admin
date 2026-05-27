CREATE TYPE "public"."video_status" AS ENUM('uploaded', 'processing', 'ready', 'failed');--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "hls_path" text;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "status" "video_status" DEFAULT 'uploaded' NOT NULL;