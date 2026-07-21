CREATE TABLE "templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"thumbnail" varchar(500),
	"description" text,
	"isActive" boolean DEFAULT false NOT NULL,
	"category" varchar(100),
	"use_count" integer DEFAULT 0 NOT NULL,
	"tags" varchar(100)[] DEFAULT '{}',
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "templates_category_idx" ON "templates" USING btree ("category");