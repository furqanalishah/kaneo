ALTER TABLE "task" ADD COLUMN "type" text DEFAULT 'task' NOT NULL;--> statement-breakpoint
CREATE INDEX "task_type_idx" ON "task" USING btree ("type");