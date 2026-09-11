ALTER TABLE "kosh" RENAME COLUMN "code" TO "transaction_pin";--> statement-breakpoint
ALTER TABLE "kosh" DROP CONSTRAINT "kosh_code_unique";