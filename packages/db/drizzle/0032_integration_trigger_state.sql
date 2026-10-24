CREATE TABLE "integration_trigger_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" varchar(100) NOT NULL,
	"resource_key" text NOT NULL,
	"workflow_id" uuid NOT NULL,
	"trigger_node_id" uuid NOT NULL,
	"credential_id" uuid,
	"value" jsonb NOT NULL,
	"next_run_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "integration_trigger_resource_unique" UNIQUE("provider","resource_key"),
	CONSTRAINT "integration_trigger_workflow_unique" UNIQUE("provider","workflow_id")
);
--> statement-breakpoint
ALTER TABLE "integration_trigger_state" ADD CONSTRAINT "integration_trigger_state_workflow_id_user_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."user_workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_trigger_state" ADD CONSTRAINT "integration_trigger_state_credential_id_credentials_id_fk" FOREIGN KEY ("credential_id") REFERENCES "public"."credentials"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "integration_trigger_due_idx" ON "integration_trigger_state" USING btree ("provider","next_run_at");