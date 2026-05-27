ALTER TABLE "cron_jobs" ALTER COLUMN "command" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "cron_jobs" ADD COLUMN "script_path" text;--> statement-breakpoint
ALTER TABLE "cron_jobs" ADD COLUMN "script_filename" text;