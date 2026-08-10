CREATE TABLE "page" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"parent_id" text,
	"title" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"icon" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_task_link" (
	"id" text PRIMARY KEY NOT NULL,
	"page_id" text NOT NULL,
	"task_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "page_task_link_unique" UNIQUE("page_id","task_id")
);
--> statement-breakpoint
ALTER TABLE "page" ADD CONSTRAINT "page_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "page" ADD CONSTRAINT "page_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "page" ADD CONSTRAINT "page_parent_id_page_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."page"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "page_task_link" ADD CONSTRAINT "page_task_link_page_id_page_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."page"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "page_task_link" ADD CONSTRAINT "page_task_link_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "page_workspaceId_idx" ON "page" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "page_parentId_idx" ON "page" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "page_task_link_pageId_idx" ON "page_task_link" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "page_task_link_taskId_idx" ON "page_task_link" USING btree ("task_id");