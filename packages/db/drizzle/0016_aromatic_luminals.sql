DO $$ BEGIN
 CREATE TYPE "public"."execution_status" AS ENUM('running', 'success', 'failed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."node_execution_status" AS ENUM('running', 'success', 'failed', 'skipped');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TYPE "public"."WorkflowStatusEnum" RENAME TO "workflow_status";
EXCEPTION WHEN undefined_object THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "workflow_executions" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_workflows" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE IF EXISTS "public"."workflow_status" CASCADE;--> statement-breakpoint
CREATE TYPE "public"."workflow_status" AS ENUM('active', 'inactive');--> statement-breakpoint
ALTER TABLE "user_workflows" ALTER COLUMN "status" SET DATA TYPE "public"."workflow_status" USING "status"::"public"."workflow_status";--> statement-breakpoint
ALTER TABLE "workflow_executions" ALTER COLUMN "status" SET DATA TYPE "public"."execution_status" USING "status"::"public"."execution_status";--> statement-breakpoint
ALTER TABLE "workflow_executions" ALTER COLUMN "status" SET DEFAULT 'running'::"public"."execution_status";--> statement-breakpoint
ALTER TABLE "workflow_executions" ALTER COLUMN "started_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "workflow_executions" ALTER COLUMN "started_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "workflow_executions" ALTER COLUMN "completed_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "node_executions" ALTER COLUMN "executed_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "node_executions" ALTER COLUMN "executed_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "node_executions" ALTER COLUMN "completed_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_workflows" ALTER COLUMN "last_executed_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_workflows" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_workflows" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_workflows" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_workflows" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "node_executions" ADD COLUMN IF NOT EXISTS "status" "node_execution_status" NOT NULL;