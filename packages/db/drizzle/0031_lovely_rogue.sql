ALTER TABLE "templates" ADD COLUMN "node_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "trigger_type" varchar(20);--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "integrations_used" varchar(100)[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "difficulty" varchar(20);--> statement-breakpoint
CREATE INDEX "templates_trigger_type_idx" ON "templates" USING btree ("trigger_type");--> statement-breakpoint
CREATE INDEX "templates_difficulty_idx" ON "templates" USING btree ("difficulty");--> statement-breakpoint
ALTER TABLE "templates" DROP COLUMN "thumbnail";