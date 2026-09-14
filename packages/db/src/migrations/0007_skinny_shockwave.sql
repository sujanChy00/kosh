ALTER TABLE "contribution" RENAME COLUMN "paid_amount" TO "contribution_amount";--> statement-breakpoint
ALTER TABLE "contribution" RENAME COLUMN "penalty_amount" TO "penalty_assessed";--> statement-breakpoint
ALTER TABLE "loan_repayment" RENAME COLUMN "amount" TO "principal_portion";--> statement-breakpoint
ALTER TABLE "loan_request" ALTER COLUMN "requested_by" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "loan_repayment" ADD COLUMN "interest_portion" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "loan_request" ADD COLUMN "non_member_borrower_id" uuid;--> statement-breakpoint
ALTER TABLE "loan_request" ADD CONSTRAINT "loan_request_non_member_borrower_id_non_member_borrower_id_fk" FOREIGN KEY ("non_member_borrower_id") REFERENCES "public"."non_member_borrower"("id") ON DELETE cascade ON UPDATE no action;