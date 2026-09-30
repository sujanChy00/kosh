import { db } from "@kosh-app/db";
import { notification } from "@kosh-app/db/schema/notifications";
import { and, count, eq, isNull, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

/**
 * The feed is chat-only for now, so every query here filters on this one type.
 *
 * Hard-coded rather than derived from the rows: of the 21 notification types,
 * only `chat_message`, `join_request_submitted`, `treasurer_invite` and
 * `role_changed` actually have producers, so a feed that let the others through
 * would be dominated by the one event that already has a dedicated screen.
 */
const FEED_TYPE = "chat_message";

const listSchema = z.object({
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.string().nullable().optional(),
});

const markReadSchema = z.object({
  threadId: z.uuid(),
});

/** One row of the feed: the newest chat notification in a thread. */
export type NotificationFeedItem = {
  id: string;
  threadId: string;
  koshId: string | null;
  title: string;
  body: string;
  /** Newest `created_at` in the thread, epoch ms. Also the sort key. */
  lastActivityMs: number;
  unreadCount: number;
};

type FeedRow = {
  id: string;
  thread_id: string | null;
  kosh_id: string | null;
  title: string;
  body: string;
  sort_key_ms: string | number;
  unread_count: string | number;
};

/**
 * Keyset cursor shape: `${sortKeyMs}|${threadId}`.
 *
 * The thread id is part of the cursor because two threads can have their newest
 * message in the same millisecond; ordering on `created_at` alone would let a
 * row on a page boundary be returned twice or skipped entirely.
 */
function decodeCursor(cursor: string | null | undefined) {
  if (!cursor)
    return {
      sortKeyMs: null as number | null,
      threadId: null as string | null,
    };
  const [rawMs, threadId] = cursor.split("|", 2);
  const sortKeyMs = Number(rawMs);
  if (!threadId || Number.isNaN(sortKeyMs)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid pagination cursor",
    });
  }
  return { sortKeyMs, threadId };
}

/**
 * One row per thread, carrying how many of that thread's notifications are
 * unread.
 *
 * `ROW_NUMBER` and `COUNT` are window functions, so they are evaluated across
 * the whole partition before `rn = 1` collapses each thread down to its newest
 * row - which is the only way to get the per-thread unread count without a
 * second scan of the same rows.
 *
 * Table and column names are written literally rather than interpolated from
 * the schema object: this is a multi-line CTE, and drizzle's `sql` template
 * parameterises values but cannot alias a table it builds, so
 * `${notification.createdAt}` would render as `"notification"."created_at"`
 * with no alias to bind to. There is exactly one table and no join here, so the
 * short names are unambiguous.
 */
export const notificationRouter = router({
  /**
   * The in-app feed: one row per thread, newest activity first.
   */
  list: protectedProcedure.input(listSchema).query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;
    const { limit } = input;
    const { sortKeyMs, threadId } = decodeCursor(input.cursor);

    /**
     * Filters on the *grouped* row, not the inner scan. The feed is sorted by
     * a thread's newest message, which is not the `created_at` of the rows
     * that thread contributed to an earlier page.
     */
    const cursorFilter =
      sortKeyMs !== null && threadId
        ? sql`AND (sort_key_ms, thread_id) < (${sortKeyMs}::bigint, ${threadId}::text)`
        : sql``;

    const query = sql`
        WITH feed AS (
          SELECT
            id,
            (data->>'threadId') AS thread_id,
            (data->>'koshId') AS kosh_id,
            title,
            body,
            (EXTRACT(EPOCH FROM created_at) * 1000)::bigint AS sort_key_ms,
            ROW_NUMBER() OVER (
              PARTITION BY (data->>'threadId')
              ORDER BY created_at DESC, id DESC
            ) AS rn,
            COUNT(*) FILTER (WHERE read_at IS NULL)
              OVER (PARTITION BY (data->>'threadId')) AS unread_count
          FROM notification
          WHERE user_id = ${userId}
            AND type = ${FEED_TYPE}
            AND data->>'threadId' IS NOT NULL
        )
        SELECT id, thread_id, kosh_id, title, body, sort_key_ms, unread_count
        FROM feed
        WHERE rn = 1
        ${cursorFilter}
        ORDER BY sort_key_ms DESC, thread_id DESC
        LIMIT ${limit + 1}
      `;

    const result = (await db.execute(query)) as unknown as {
      rows: FeedRow[];
    };
    const rows = result.rows ?? [];

    const hasNextPage = rows.length > limit;
    const page = hasNextPage ? rows.slice(0, limit) : rows;
    const last = page.at(-1);

    const items: NotificationFeedItem[] = page.map((r) => ({
      id: r.id,
      threadId: r.thread_id ?? "",
      koshId: r.kosh_id ?? null,
      title: r.title,
      body: r.body,
      lastActivityMs: Number(r.sort_key_ms),
      unreadCount: Number(r.unread_count),
    }));

    return {
      items,
      nextCursor:
        hasNextPage && last && last.sort_key_ms !== null
          ? `${last.sort_key_ms}|${last.thread_id}`
          : null,
    };
  }),

  /**
   * Unread chat notifications, for the bell badge.
   *
   * Separate from the feed on purpose: the badge is needed on every screen, and
   * summing the loaded pages of a paginated list would undercount for anyone
   * with more notifications than fit on one screen. This is one indexed count
   * with no row payload.
   *
   * Note the badge counts *notifications* while the feed counts *threads*, so a
   * thread with three unread messages shows as one row but contributes three to
   * the badge. That is intentional and is why each row renders its own count.
   *
   * The `threadId` filter has to match the feed's exactly. The feed cannot
   * render a row without one, so counting those here would put a number on the
   * bell that nothing on the screen can account for.
   */
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await db
      .select({ value: count() })
      .from(notification)
      .where(
        and(
          eq(notification.userId, ctx.session.user.id),
          eq(notification.type, FEED_TYPE),
          isNull(notification.readAt),
          sql`${notification.data}->>'threadId' IS NOT NULL`,
        ),
      );
    return row?.value ?? 0;
  }),

  /**
   * Marks every notification in a thread read. Driven by tapping a feed row.
   */
  markRead: protectedProcedure
    .input(markReadSchema)
    .mutation(async ({ ctx, input }) => {
      const changed = await db
        .update(notification)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(notification.userId, ctx.session.user.id),
            eq(notification.type, FEED_TYPE),
            isNull(notification.readAt),
            sql`${notification.data}->>'threadId' = ${input.threadId}`,
          ),
        )
        .returning({ id: notification.id });

      return { success: true, count: changed.length };
    }),
});
