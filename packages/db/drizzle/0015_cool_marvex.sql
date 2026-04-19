DROP INDEX "node_exec_workflowInstanceIds_idx";--> statement-breakpoint
ALTER TABLE "node_executions" ADD COLUMN "workflow_execution_id" uuid;--> statement-breakpoint
UPDATE "node_executions" ne SET "workflow_execution_id" = (SELECT we."id" FROM "workflow_executions" we WHERE ne."workflow_id" = we."workflow_id" ORDER BY we."started_at" DESC LIMIT 1) WHERE ne."workflow_execution_id" IS NULL;--> statement-breakpoint
ALTER TABLE "node_executions" ALTER COLUMN "workflow_execution_id" SET NOT NULL;
ALTER TABLE "node_executions" ADD CONSTRAINT "node_executions_workflow_execution_id_workflow_executions_id_fk" FOREIGN KEY ("workflow_execution_id") REFERENCES "public"."workflow_executions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "node_workflow_execution_idx" ON "node_executions" USING btree ("workflow_execution_id");--> statement-breakpoint
ALTER TABLE "workflow_nodes" ADD CONSTRAINT "unique_workflow_node_name" UNIQUE("workflow_id","name");
