CREATE TABLE "template_data" (
	"template_id" uuid PRIMARY KEY NOT NULL,
	"nodes" jsonb NOT NULL,
	"connections" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "template_data" ADD CONSTRAINT "template_data_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "template_data_template_id_idx" ON "template_data" USING btree ("template_id");