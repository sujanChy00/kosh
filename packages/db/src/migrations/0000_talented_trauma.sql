CREATE TYPE "public"."approval_decision" AS ENUM('approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."chat_thread_type" AS ENUM('group', 'direct');--> statement-breakpoint
CREATE TYPE "public"."contribution_status" AS ENUM('pending', 'paid', 'partial', 'late');--> statement-breakpoint
CREATE TYPE "public"."invite_status" AS ENUM('active', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE "public"."invite_type" AS ENUM('targeted_email', 'open_link');--> statement-breakpoint
CREATE TYPE "public"."join_request_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."loan_status" AS ENUM('active', 'paid_off', 'defaulted');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('adhyaksha', 'koshadhyaksha', 'sadasya');--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM('active', 'pending', 'left', 'removed');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('invite', 'contribution_due', 'loan_due', 'approval_needed', 'transaction_approved', 'transaction_rejected', 'chat_message');--> statement-breakpoint
CREATE TYPE "public"."payment_method_type" AS ENUM('bank', 'wallet', 'qr');--> statement-breakpoint
CREATE TYPE "public"."payout_status" AS ENUM('pending', 'approved', 'paid');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('ios', 'android');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending_approval', 'approved', 'rejected', 'executed');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('contribution', 'loan_disbursement', 'loan_repayment', 'payout');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kosh_id" uuid,
	"actor_id" text NOT NULL,
	"action" text NOT NULL,
	"old_value" jsonb,
	"new_value" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"issuer" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"biometric_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"sender_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"edited_at" timestamp,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "chat_thread" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kosh_id" uuid NOT NULL,
	"type" "chat_thread_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_thread_participant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"last_read_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "contribution" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kosh_id" uuid NOT NULL,
	"member_id" text NOT NULL,
	"period" date NOT NULL,
	"expected_amount" numeric(12, 2) NOT NULL,
	"paid_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"status" "contribution_status" DEFAULT 'pending' NOT NULL,
	"penalty_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"date_paid" timestamp,
	"recorded_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kosh" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon_url" text,
	"monthly_amount" numeric(12, 2) NOT NULL,
	"due_day" integer NOT NULL,
	"currency" text DEFAULT 'NPR' NOT NULL,
	"member_interest_rate" numeric(5, 2) NOT NULL,
	"non_member_interest_rate" numeric(5, 2) NOT NULL,
	"loan_cap" numeric(12, 2) NOT NULL,
	"late_penalty_amount" numeric(12, 2),
	"start_date" date NOT NULL,
	"duration_months" integer NOT NULL,
	"end_date" date NOT NULL,
	"min_treasurers" integer DEFAULT 0 NOT NULL,
	"max_members" integer,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kosh_membership" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kosh_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "member_role" DEFAULT 'sadasya' NOT NULL,
	"status" "member_status" DEFAULT 'active' NOT NULL,
	"joined_at" timestamp,
	"left_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "payment_method" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" "payment_method_type" NOT NULL,
	"label" text,
	"account_details" jsonb NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invite" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kosh_id" uuid NOT NULL,
	"type" "invite_type" NOT NULL,
	"token" text NOT NULL,
	"invited_email" text,
	"created_by" text NOT NULL,
	"max_uses" integer,
	"use_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp NOT NULL,
	"status" "invite_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invite_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "join_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invite_id" uuid NOT NULL,
	"kosh_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"status" "join_request_status" DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "loan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kosh_id" uuid NOT NULL,
	"borrower_id" text,
	"non_member_borrower_id" uuid,
	"principal" numeric(12, 2) NOT NULL,
	"interest_rate" numeric(5, 2) NOT NULL,
	"issue_date" date NOT NULL,
	"due_date" date,
	"status" "loan_status" DEFAULT 'active' NOT NULL,
	"amount_remaining" numeric(12, 2) NOT NULL,
	"payout_method_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loan_repayment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loan_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"remaining_balance_after" numeric(12, 2) NOT NULL,
	"recorded_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "non_member_borrower" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kosh_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kosh_id" uuid NOT NULL,
	"type" "transaction_type" NOT NULL,
	"reference_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"initiated_by" text NOT NULL,
	"status" "transaction_status" DEFAULT 'pending_approval' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"executed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "transaction_approval" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"treasurer_id" text NOT NULL,
	"decision" "approval_decision" NOT NULL,
	"reason" text,
	"decided_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kosh_end_payout" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kosh_id" uuid NOT NULL,
	"member_id" text NOT NULL,
	"gross_share" numeric(12, 2) NOT NULL,
	"loan_deduction" numeric(12, 2) NOT NULL,
	"net_payout" numeric(12, 2) NOT NULL,
	"payout_method_id" uuid,
	"status" "payout_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"data" jsonb,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_token" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"expo_push_token" text NOT NULL,
	"device_id" text,
	"platform" "platform" NOT NULL,
	"last_used_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "push_token_expo_push_token_unique" UNIQUE("expo_push_token")
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_kosh_id_kosh_id_fk" FOREIGN KEY ("kosh_id") REFERENCES "public"."kosh"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_thread_id_chat_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."chat_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_thread" ADD CONSTRAINT "chat_thread_kosh_id_kosh_id_fk" FOREIGN KEY ("kosh_id") REFERENCES "public"."kosh"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_thread_participant" ADD CONSTRAINT "chat_thread_participant_thread_id_chat_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."chat_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_thread_participant" ADD CONSTRAINT "chat_thread_participant_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contribution" ADD CONSTRAINT "contribution_kosh_id_kosh_id_fk" FOREIGN KEY ("kosh_id") REFERENCES "public"."kosh"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contribution" ADD CONSTRAINT "contribution_member_id_user_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contribution" ADD CONSTRAINT "contribution_recorded_by_user_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kosh" ADD CONSTRAINT "kosh_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kosh_membership" ADD CONSTRAINT "kosh_membership_kosh_id_kosh_id_fk" FOREIGN KEY ("kosh_id") REFERENCES "public"."kosh"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kosh_membership" ADD CONSTRAINT "kosh_membership_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_method" ADD CONSTRAINT "payment_method_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite" ADD CONSTRAINT "invite_kosh_id_kosh_id_fk" FOREIGN KEY ("kosh_id") REFERENCES "public"."kosh"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite" ADD CONSTRAINT "invite_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "join_request" ADD CONSTRAINT "join_request_invite_id_invite_id_fk" FOREIGN KEY ("invite_id") REFERENCES "public"."invite"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "join_request" ADD CONSTRAINT "join_request_kosh_id_kosh_id_fk" FOREIGN KEY ("kosh_id") REFERENCES "public"."kosh"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "join_request" ADD CONSTRAINT "join_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "join_request" ADD CONSTRAINT "join_request_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan" ADD CONSTRAINT "loan_kosh_id_kosh_id_fk" FOREIGN KEY ("kosh_id") REFERENCES "public"."kosh"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan" ADD CONSTRAINT "loan_borrower_id_user_id_fk" FOREIGN KEY ("borrower_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan" ADD CONSTRAINT "loan_non_member_borrower_id_non_member_borrower_id_fk" FOREIGN KEY ("non_member_borrower_id") REFERENCES "public"."non_member_borrower"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan" ADD CONSTRAINT "loan_payout_method_id_payment_method_id_fk" FOREIGN KEY ("payout_method_id") REFERENCES "public"."payment_method"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_repayment" ADD CONSTRAINT "loan_repayment_loan_id_loan_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_repayment" ADD CONSTRAINT "loan_repayment_recorded_by_user_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "non_member_borrower" ADD CONSTRAINT "non_member_borrower_kosh_id_kosh_id_fk" FOREIGN KEY ("kosh_id") REFERENCES "public"."kosh"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_kosh_id_kosh_id_fk" FOREIGN KEY ("kosh_id") REFERENCES "public"."kosh"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_initiated_by_user_id_fk" FOREIGN KEY ("initiated_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_approval" ADD CONSTRAINT "transaction_approval_transaction_id_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_approval" ADD CONSTRAINT "transaction_approval_treasurer_id_user_id_fk" FOREIGN KEY ("treasurer_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kosh_end_payout" ADD CONSTRAINT "kosh_end_payout_kosh_id_kosh_id_fk" FOREIGN KEY ("kosh_id") REFERENCES "public"."kosh"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kosh_end_payout" ADD CONSTRAINT "kosh_end_payout_member_id_user_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kosh_end_payout" ADD CONSTRAINT "kosh_end_payout_payout_method_id_payment_method_id_fk" FOREIGN KEY ("payout_method_id") REFERENCES "public"."payment_method"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_token" ADD CONSTRAINT "push_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_kosh_id_idx" ON "audit_log" USING btree ("kosh_id");--> statement-breakpoint
CREATE INDEX "audit_log_actor_id_idx" ON "audit_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "account_issuer_accountId_uidx" ON "account" USING btree ("issuer","account_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "chat_message_thread_id_idx" ON "chat_message" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "chat_message_created_at_idx" ON "chat_message" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "chat_thread_kosh_id_idx" ON "chat_thread" USING btree ("kosh_id");--> statement-breakpoint
CREATE INDEX "chat_participant_thread_id_idx" ON "chat_thread_participant" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "chat_participant_user_id_idx" ON "chat_thread_participant" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "contribution_kosh_id_idx" ON "contribution" USING btree ("kosh_id");--> statement-breakpoint
CREATE INDEX "contribution_member_id_idx" ON "contribution" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "contribution_period_idx" ON "contribution" USING btree ("kosh_id","period");--> statement-breakpoint
CREATE UNIQUE INDEX "kosh_membership_kosh_user_uidx" ON "kosh_membership" USING btree ("kosh_id","user_id");--> statement-breakpoint
CREATE INDEX "invite_kosh_id_idx" ON "invite" USING btree ("kosh_id");--> statement-breakpoint
CREATE INDEX "invite_invited_email_idx" ON "invite" USING btree ("invited_email");--> statement-breakpoint
CREATE INDEX "join_request_kosh_id_idx" ON "join_request" USING btree ("kosh_id");--> statement-breakpoint
CREATE INDEX "join_request_user_id_idx" ON "join_request" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "loan_kosh_id_idx" ON "loan" USING btree ("kosh_id");--> statement-breakpoint
CREATE INDEX "loan_borrower_id_idx" ON "loan" USING btree ("borrower_id");--> statement-breakpoint
CREATE INDEX "loan_repayment_loan_id_idx" ON "loan_repayment" USING btree ("loan_id");--> statement-breakpoint
CREATE INDEX "transaction_kosh_id_idx" ON "transaction" USING btree ("kosh_id");--> statement-breakpoint
CREATE INDEX "transaction_status_idx" ON "transaction" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transaction_initiated_by_idx" ON "transaction" USING btree ("initiated_by");--> statement-breakpoint
CREATE INDEX "transaction_approval_transaction_id_idx" ON "transaction_approval" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "transaction_approval_treasurer_id_idx" ON "transaction_approval" USING btree ("treasurer_id");--> statement-breakpoint
CREATE INDEX "kosh_end_payout_kosh_id_idx" ON "kosh_end_payout" USING btree ("kosh_id");--> statement-breakpoint
CREATE INDEX "kosh_end_payout_member_id_idx" ON "kosh_end_payout" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "notification_user_id_idx" ON "notification" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_read_at_idx" ON "notification" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE INDEX "push_token_user_id_idx" ON "push_token" USING btree ("user_id");