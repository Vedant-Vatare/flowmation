ALTER TABLE "node_executions" DROP CONSTRAINT "node_executions_workflowId_user_workflows_id_fk";
--> statement-breakpoint
ALTER TABLE "node_executions" DROP CONSTRAINT "node_executions_instance_id_workflow_nodes_id_fk";
--> statement-breakpoint
ALTER TABLE "user_workflows" DROP CONSTRAINT "user_workflows_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_connections" DROP CONSTRAINT "workflow_connections_source_id_workflow_nodes_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_connections" DROP CONSTRAINT "workflow_connections_target_id_workflow_nodes_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_executions" DROP CONSTRAINT "workflow_executions_workflowId_user_workflows_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_executions" DROP CONSTRAINT "workflow_executions_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_nodes" DROP CONSTRAINT "workflow_nodes_node_id_nodes_id_fk";
--> statement-breakpoint
ALTER TABLE "node_executions" ADD CONSTRAINT "node_executions_workflowId_user_workflows_id_fk" FOREIGN KEY ("workflowId") REFERENCES "public"."user_workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_executions" ADD CONSTRAINT "node_executions_instance_id_workflow_nodes_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."workflow_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_workflows" ADD CONSTRAINT "user_workflows_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_connections" ADD CONSTRAINT "workflow_connections_source_id_workflow_nodes_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."workflow_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_connections" ADD CONSTRAINT "workflow_connections_target_id_workflow_nodes_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."workflow_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_workflowId_user_workflows_id_fk" FOREIGN KEY ("workflowId") REFERENCES "public"."user_workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_nodes" ADD CONSTRAINT "workflow_nodes_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;