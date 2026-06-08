CREATE TABLE "workflow_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"nodes" jsonb NOT NULL,
	"connections" jsonb NOT NULL,
	"published_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workflow_snapshots" ADD CONSTRAINT "workflow_snapshots_workflow_id_user_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."user_workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "snapshot_workflowId_idx" ON "workflow_snapshots" USING btree ("workflow_id");