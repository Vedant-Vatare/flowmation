CREATE TYPE "public"."credentialProvider" AS ENUM('google', 'github', 'openai');--> statement-breakpoint
CREATE TYPE "public"."credentialTypes" AS ENUM('apiKey', 'oauth');--> statement-breakpoint
ALTER TABLE "credentials" ALTER COLUMN "provider" SET DATA TYPE "public"."credentialProvider" USING "provider"::"public"."credentialProvider";--> statement-breakpoint
ALTER TABLE "credentials" ALTER COLUMN "type" SET DATA TYPE "public"."credentialTypes" USING "type"::"public"."credentialTypes";--> statement-breakpoint
ALTER TABLE "nodes" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "nodes" ADD COLUMN "config" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "nodes" DROP COLUMN "credentials";--> statement-breakpoint
ALTER TABLE "workflow_nodes" DROP COLUMN "credentials";