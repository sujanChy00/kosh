ALTER TABLE "kosh" ADD COLUMN "apply_penalty" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "kosh" ADD COLUMN "penalty_grace_days" integer;--> statement-breakpoint
-- Backfill: keep existing koshes that already defined a penalty amount enforcing
-- it with the legacy behavior (penalty from the day after the due date).
UPDATE "kosh" SET "apply_penalty" = true WHERE "late_penalty_amount" IS NOT NULL;