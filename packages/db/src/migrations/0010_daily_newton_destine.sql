ALTER TABLE "chat_message" ADD COLUMN "client_id" text;--> statement-breakpoint
ALTER TABLE "chat_thread" ADD COLUMN "last_message_at" timestamp;--> statement-breakpoint
ALTER TABLE "chat_thread" ADD COLUMN "last_message_preview" text;--> statement-breakpoint
ALTER TABLE "chat_thread" ADD COLUMN "direct_key" text;--> statement-breakpoint
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_reply_to_id_chat_message_id_fk" FOREIGN KEY ("reply_to_id") REFERENCES "public"."chat_message"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "chat_message_sender_client_uidx" ON "chat_message" USING btree ("sender_id","client_id") WHERE "chat_message"."client_id" is not null;--> statement-breakpoint
CREATE INDEX "chat_thread_last_message_at_idx" ON "chat_thread" USING btree ("last_message_at");--> statement-breakpoint
CREATE UNIQUE INDEX "chat_thread_direct_key_uidx" ON "chat_thread" USING btree ("direct_key");--> statement-breakpoint
CREATE UNIQUE INDEX "chat_thread_group_kosh_uidx" ON "chat_thread" USING btree ("kosh_id") WHERE "chat_thread"."type" = 'group';--> statement-breakpoint
CREATE UNIQUE INDEX "chat_participant_thread_user_uidx" ON "chat_thread_participant" USING btree ("thread_id","user_id");--> statement-breakpoint
-- Backfill: every kosh that predates chat gets exactly one group thread, with
-- an explicit timestamp so existing threads sort below any that receive a
-- message later. last_message_at stays NULL (no messages yet).
INSERT INTO "chat_thread" ("kosh_id", "type", "created_at")
SELECT "k"."id", 'group', "k"."created_at"
FROM "kosh" AS "k"
WHERE NOT EXISTS (
  SELECT 1 FROM "chat_thread" AS "t"
  WHERE "t"."kosh_id" = "k"."id" AND "t"."type" = 'group'
);--> statement-breakpoint
-- Backfill: seat the currently active members of each kosh in its group thread.
-- Left/pending/removed members are deliberately excluded - they are not
-- participants and lose access to the thread.
INSERT INTO "chat_thread_participant" ("thread_id", "user_id", "joined_at")
SELECT "t"."id", "m"."user_id", COALESCE("m"."joined_at", "t"."created_at")
FROM "chat_thread" AS "t"
JOIN "kosh_membership" AS "m" ON "m"."kosh_id" = "t"."kosh_id"
WHERE "t"."type" = 'group'
  AND "m"."status" = 'active'
ON CONFLICT ("thread_id", "user_id") DO NOTHING;