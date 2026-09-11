ALTER TABLE "user" ADD COLUMN "selected_kosh_id" uuid;--> statement-breakpoint
ALTER TABLE "kosh" ADD COLUMN "code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_selected_kosh_id_kosh_id_fk" FOREIGN KEY ("selected_kosh_id") REFERENCES "public"."kosh"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_selected_kosh_id_idx" ON "user" USING btree ("selected_kosh_id");--> statement-breakpoint
ALTER TABLE "kosh" ADD CONSTRAINT "kosh_code_unique" UNIQUE("code");