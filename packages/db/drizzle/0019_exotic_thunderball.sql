ALTER TABLE "nodes" RENAME COLUMN "config" TO "settings";--> statement-breakpoint
ALTER TABLE "credentials" ALTER COLUMN "provider" SET DATA TYPE varchar(255);--> statement-breakpoint
DROP TYPE "public"."credentialProvider";