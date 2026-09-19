CREATE TABLE "kosh_period" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kosh_id" uuid NOT NULL,
	"period" date NOT NULL,
	"due_day" integer NOT NULL,
	"monthly_amount" numeric(12, 2) NOT NULL,
	"apply_penalty" boolean DEFAULT false NOT NULL,
	"late_penalty_amount" numeric(12, 2),
	"penalty_grace_days" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kosh_period" ADD CONSTRAINT "kosh_period_kosh_id_kosh_id_fk" FOREIGN KEY ("kosh_id") REFERENCES "public"."kosh"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "kosh_period_kosh_period_uidx" ON "kosh_period" USING btree ("kosh_id","period");