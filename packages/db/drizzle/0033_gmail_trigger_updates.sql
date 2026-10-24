ALTER TABLE "integration_trigger_state" DROP CONSTRAINT "integration_trigger_resource_unique";
--> statement-breakpoint
ALTER TABLE "integration_trigger_state" DROP CONSTRAINT "integration_trigger_workflow_unique";
--> statement-breakpoint
DROP INDEX "integration_trigger_due_idx";
--> statement-breakpoint
ALTER TABLE "integration_trigger_state" DROP COLUMN "next_run_at";
--> statement-breakpoint
CREATE INDEX "integration_trigger_resource_idx" ON "integration_trigger_state" USING btree ("provider","resource_key");
--> statement-breakpoint
ALTER TABLE "integration_trigger_state" ADD CONSTRAINT "integration_trigger_node_unique" UNIQUE("provider","workflow_id","trigger_node_id");
