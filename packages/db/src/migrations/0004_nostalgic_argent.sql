CREATE TYPE "public"."treasurer_invite_status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'treasurer_invite' BEFORE 'contribution_due';--> statement-breakpoint
ALTER TABLE "kosh_membership" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "kosh_membership" ALTER COLUMN "role" SET DEFAULT 'sadasya'::text;--> statement-breakpoint
DROP TYPE "public"."member_role";--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('adhyaksh', 'koshadhyaksh', 'sadasya');--> statement-breakpoint
ALTER TABLE "kosh_membership" ALTER COLUMN "role" SET DEFAULT 'sadasya'::"public"."member_role";--> statement-breakpoint
ALTER TABLE "kosh_membership" ALTER COLUMN "role" SET DATA TYPE "public"."member_role" USING "role"::"public"."member_role";--> statement-breakpoint
ALTER TABLE "loan_request" RENAME COLUMN "adhyaksha_decided_by" TO "adhyaksh_decided_by";--> statement-breakpoint
ALTER TABLE "loan_request" RENAME COLUMN "adhyaksha_decided_at" TO "adhyaksh_decided_at";--> statement-breakpoint
ALTER TABLE "loan_request" DROP CONSTRAINT "loan_request_adhyaksha_decided_by_user_id_fk";--> statement-breakpoint
ALTER TABLE "loan_request" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "loan_request" ALTER COLUMN "status" SET DEFAULT 'pending_adhyaksh'::text;--> statement-breakpoint
DROP TYPE "public"."loan_request_status";--> statement-breakpoint
CREATE TYPE "public"."loan_request_status" AS ENUM('pending_adhyaksh', 'pending_koshadhyaksh', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "loan_request" ALTER COLUMN "status" SET DEFAULT 'pending_adhyaksh'::"public"."loan_request_status";--> statement-breakpoint
ALTER TABLE "loan_request" ALTER COLUMN "status" SET DATA TYPE "public"."loan_request_status" USING "status"::"public"."loan_request_status";--> statement-breakpoint
CREATE TABLE "kosh_role_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kosh_id" uuid NOT NULL,
	"invited_by" text NOT NULL,
	"invitee_id" text NOT NULL,
	"target_role" "member_role" DEFAULT 'koshadhyaksh' NOT NULL,
	"status" "treasurer_invite_status" DEFAULT 'pending' NOT NULL,
	"reason" text,
	"decided_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "invite" ALTER COLUMN "expires_at" SET DEFAULT (now() + interval '7 days');--> statement-breakpoint
ALTER TABLE "kosh" ADD COLUMN "code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "kosh_role_request" ADD CONSTRAINT "kosh_role_request_kosh_id_kosh_id_fk" FOREIGN KEY ("kosh_id") REFERENCES "public"."kosh"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kosh_role_request" ADD CONSTRAINT "kosh_role_request_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kosh_role_request" ADD CONSTRAINT "kosh_role_request_invitee_id_user_id_fk" FOREIGN KEY ("invitee_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "kosh_role_request_kosh_idx" ON "kosh_role_request" USING btree ("kosh_id");--> statement-breakpoint
CREATE INDEX "kosh_role_request_invitee_idx" ON "kosh_role_request" USING btree ("invitee_id");--> statement-breakpoint
ALTER TABLE "loan_request" ADD CONSTRAINT "loan_request_adhyaksh_decided_by_user_id_fk" FOREIGN KEY ("adhyaksh_decided_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kosh" DROP COLUMN "min_treasurers";--> statement-breakpoint
ALTER TABLE "kosh" ADD CONSTRAINT "kosh_code_unique" UNIQUE("code");