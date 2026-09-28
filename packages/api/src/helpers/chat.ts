import { db } from "@kosh-app/db";
import { chatThread, chatThreadParticipant } from "@kosh-app/db/schema/chat";
import { koshMembership } from "@kosh-app/db/schema/kosh";
import { TRPCError } from "@trpc/server";
import { and, eq, exists, sql } from "drizzle-orm";

import type { DbOrTx } from "./db";

const PREVIEW_MAX = 120;

/** `group` shows the text, `image`/`file` show a label, `system` the content. */
export function buildMessagePreview(
  type: "text" | "image" | "file" | "system",
  content: string | null,
  attachmentCount: number,
): string {
  const base = (content ?? "").trim();
  if (base) return base.length > PREVIEW_MAX ? `${base.slice(0, PREVIEW_MAX)}…` : base;
  if (type === "image") {
    return attachmentCount > 1 ? `Sent ${attachmentCount} photos` : "Sent a photo";
  }
  if (type === "file") {
    return attachmentCount > 1 ? `Sent ${attachmentCount} files` : "Sent a file";
  }
  return "No message text";
}

/**
 * Seat a user in a kosh's group thread, if they aren't already. Idempotent via
 * the (thread_id, user_id) unique index, so it is safe to call on every
 * membership approval and on kosh creation.
 */
export async function ensureGroupParticipant(
  client: DbOrTx,
  koshId: string,
  userId: string,
) {
  const [thread] = await client
    .insert(chatThread)
    .values({ koshId, type: "group" })
    .onConflictDoNothing({
      target: chatThread.koshId,
      // The one-group-thread-per-kosh index is partial, so it can only be
      // inferred by an ON CONFLICT that repeats the same predicate.
      where: sql`${chatThread.type} = 'group'`,
    })
    .returning({ id: chatThread.id });

  const threadId =
    thread?.id ??
    (
      await client.query.chatThread.findFirst({
        columns: { id: true },
        where: and(eq(chatThread.koshId, koshId), eq(chatThread.type, "group")),
      })
    )?.id;

  if (!threadId) return null;

  await client
    .insert(chatThreadParticipant)
    .values({ threadId, userId })
    .onConflictDoNothing({
      target: [chatThreadParticipant.threadId, chatThreadParticipant.userId],
    });

  return threadId;
}

/**
 * Stable per-pair identity for a DM thread: `koshId:lowerUserId:higherUserId`.
 * Both sides of a conversation derive the same key, so the unique index on
 * `direct_key` is what actually prevents two DM threads for the same pair.
 */
export function buildDirectKey(
  koshId: string,
  userA: string,
  userB: string,
) {
  return `${koshId}:${[userA, userB].sort().join(":")}`;
}

/**
 * Access check for every chat procedure.
 *
 * Being a thread participant is necessary but not sufficient: a removed or
 * departed member keeps their participant row (so their message history stays
 * intact if they are ever re-invited), and must nonetheless lose access now.
 * Hence the second, independent check on live kosh membership.
 */
export async function requireThreadAccess(threadId: string, userId: string) {
  const row = await db
    .select({
      threadId: chatThread.id,
      koshId: chatThread.koshId,
      type: chatThread.type,
      // Built with the query builder rather than a raw `sql` fragment on
      // purpose. Inside a raw fragment `${chatThread.id}` renders as a bare
      // "id", which Postgres then resolves against the *subquery's* own table -
      // so the correlation silently became `p.thread_id = p.id`.
      isParticipant: exists(
        db
          .select({ one: sql`1` })
          .from(chatThreadParticipant)
          .where(
            and(
              eq(chatThreadParticipant.threadId, chatThread.id),
              eq(chatThreadParticipant.userId, userId),
            ),
          ),
      ),
      isActiveMember: exists(
        db
          .select({ one: sql`1` })
          .from(koshMembership)
          .where(
            and(
              eq(koshMembership.koshId, chatThread.koshId),
              eq(koshMembership.userId, userId),
              eq(koshMembership.status, "active"),
            ),
          ),
      ),
    })
    .from(chatThread)
    .where(eq(chatThread.id, threadId))
    .limit(1);

  const thread = row[0];
  if (!thread) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Thread not found" });
  }
  if (!thread.isParticipant) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a participant in this chat",
    });
  }
  if (!thread.isActiveMember) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are no longer an active member of this kosh",
    });
  }

  return thread as {
    threadId: string;
    koshId: string;
    type: "group" | "direct";
  };
}

/** Marks the caller as having read the thread. Called on focus and on new messages. */
export async function markThreadRead(threadId: string, userId: string) {
  await db
    .update(chatThreadParticipant)
    .set({ lastReadAt: new Date() })
    .where(
      and(
        eq(chatThreadParticipant.threadId, threadId),
        eq(chatThreadParticipant.userId, userId),
      ),
    );
}

/** The caller must be an active member of the kosh a thread belongs to. */
export async function requireActiveKoshMembership(koshId: string, userId: string) {
  const membership = await db.query.koshMembership.findFirst({
    where: and(
      eq(koshMembership.koshId, koshId),
      eq(koshMembership.userId, userId),
      eq(koshMembership.status, "active"),
    ),
    columns: { id: true, role: true },
  });

  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not an active member of this kosh",
    });
  }

  return membership;
}
