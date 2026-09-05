CREATE TYPE "public"."chat_message_type" AS ENUM('text', 'image', 'file', 'system');--> statement-breakpoint
CREATE TYPE "public"."loan_request_origin" AS ENUM('member_requested', 'admin_initiated');--> statement-breakpoint
CREATE TYPE "public"."loan_request_status" AS ENUM('pending_adhyaksha', 'pending_koshadhyaksha', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."preferred_lang" AS ENUM('en', 'ne');--> statement-breakpoint
CREATE TABLE "chat_message_reaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"emoji" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loan_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kosh_id" uuid NOT NULL,
	"origin" "loan_request_origin" NOT NULL,
	"requested_by" text NOT NULL,
	"created_by" text NOT NULL,
	"amount_requested" numeric(12, 2) NOT NULL,
	"note" text,
	"status" "loan_request_status" DEFAULT 'pending_adhyaksha' NOT NULL,
	"rejection_reason" text,
	"resulting_loan_id" uuid,
	"resulting_transaction_id" uuid,
	"adhyaksha_decided_by" text,
	"adhyaksha_decided_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."notification_type";--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('join_request_submitted', 'join_request_approved', 'join_request_rejected', 'role_changed', 'contribution_due', 'contribution_late', 'loan_requested', 'loan_request_approved', 'loan_request_rejected', 'loan_repayment_due', 'loan_repayment_overdue', 'transaction_pending_approval', 'transaction_approved', 'transaction_rejected', 'chat_message', 'kosh_ending_soon', 'kosh_end_payout_processed', 'member_removed', 'security_alert');--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "type" SET DATA TYPE "public"."notification_type" USING "type"::"public"."notification_type";--> statement-breakpoint
DROP INDEX "invite_invited_email_idx";--> statement-breakpoint
ALTER TABLE "chat_message" ALTER COLUMN "content" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "preferred_lang" "preferred_lang" DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_message" ADD COLUMN "reply_to_id" uuid;--> statement-breakpoint
ALTER TABLE "chat_message" ADD COLUMN "type" "chat_message_type" DEFAULT 'text' NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_message" ADD COLUMN "attachments" jsonb;--> statement-breakpoint
ALTER TABLE "join_request" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "loan" ADD COLUMN "loan_request_id" uuid;--> statement-breakpoint
ALTER TABLE "notification" ADD COLUMN "kosh_id" uuid;--> statement-breakpoint
ALTER TABLE "notification" ADD COLUMN "requires_action" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_message_reaction" ADD CONSTRAINT "chat_message_reaction_message_id_chat_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_message_reaction" ADD CONSTRAINT "chat_message_reaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_request" ADD CONSTRAINT "loan_request_kosh_id_kosh_id_fk" FOREIGN KEY ("kosh_id") REFERENCES "public"."kosh"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_request" ADD CONSTRAINT "loan_request_requested_by_user_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_request" ADD CONSTRAINT "loan_request_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_request" ADD CONSTRAINT "loan_request_adhyaksha_decided_by_user_id_fk" FOREIGN KEY ("adhyaksha_decided_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_reaction_message_id_idx" ON "chat_message_reaction" USING btree ("message_id");--> statement-breakpoint
CREATE UNIQUE INDEX "chat_reaction_message_user_emoji_uidx" ON "chat_message_reaction" USING btree ("message_id","user_id","emoji");--> statement-breakpoint
CREATE INDEX "loan_request_kosh_id_idx" ON "loan_request" USING btree ("kosh_id");--> statement-breakpoint
CREATE INDEX "loan_request_status_idx" ON "loan_request" USING btree ("status");--> statement-breakpoint
CREATE INDEX "loan_request_requested_by_idx" ON "loan_request" USING btree ("requested_by");--> statement-breakpoint
ALTER TABLE "loan" ADD CONSTRAINT "loan_loan_request_id_loan_request_id_fk" FOREIGN KEY ("loan_request_id") REFERENCES "public"."loan_request"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_kosh_id_kosh_id_fk" FOREIGN KEY ("kosh_id") REFERENCES "public"."kosh"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_message_reply_to_id_idx" ON "chat_message" USING btree ("reply_to_id");--> statement-breakpoint
CREATE INDEX "notification_kosh_id_idx" ON "notification" USING btree ("kosh_id");--> statement-breakpoint
CREATE INDEX "notification_type_idx" ON "notification" USING btree ("type");--> statement-breakpoint
ALTER TABLE "invite" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "invite" DROP COLUMN "invited_email";--> statement-breakpoint
DROP TYPE "public"."invite_type";