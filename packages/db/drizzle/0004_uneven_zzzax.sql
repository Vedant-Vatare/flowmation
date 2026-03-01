ALTER TABLE "workflow_connections" RENAME COLUMN "source_instance_id" TO "source_id";--> statement-breakpoint
ALTER TABLE "workflow_connections" RENAME COLUMN "target_instance_id" TO "target_id";--> statement-breakpoint
ALTER TABLE "workflow_connections" RENAME COLUMN "source_output" TO "source_port";--> statement-breakpoint
ALTER TABLE "workflow_connections" RENAME COLUMN "target_input" TO "target_port";--> statement-breakpoint
ALTER TABLE "workflow_nodes" DROP CONSTRAINT "workflow_nodes_instance_id_unique" CASCADE;--> statement-breakpoint
ALTER TABLE "workflow_connections" DROP CONSTRAINT IF EXISTS "workflow_connections_source_instance_id_workflow_nodes_instance_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_connections" DROP CONSTRAINT IF EXISTS "workflow_connections_target_instance_id_workflow_nodes_instance_id_fk";
--> statement-breakpoint
DROP INDEX "workflow_instance_ids_idx";--> statement-breakpoint
DROP INDEX "unique_workflow_instance";--> statement-breakpoint
ALTER TABLE "workflow_connections" ADD CONSTRAINT "workflow_connections_source_id_workflow_nodes_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."workflow_nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_connections" ADD CONSTRAINT "workflow_connections_target_id_workflow_nodes_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."workflow_nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workflow_nodes_workflow_id_idx" ON "workflow_nodes" USING btree ("workflow_id");--> statement-breakpoint
ALTER TABLE "nodes" DROP COLUMN "icon";--> statement-breakpoint
ALTER TABLE "workflow_nodes" DROP COLUMN "instance_id";--> statement-breakpoint
ALTER TABLE "workflow_connections" ADD CONSTRAINT "unique_connection" UNIQUE("source_id","source_port","target_id","target_port");--> statement-breakpoint
ALTER TABLE "workflow_nodes" ADD CONSTRAINT "unique_node_per_workflow" UNIQUE("workflow_id","node_id");