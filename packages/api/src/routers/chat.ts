import { db } from "@kosh-app/db";
import {
  chatMessage,
  chatMessageReaction,
  chatThread,
  chatThreadParticipant,
} from "@kosh-app/db/schema/chat";
import { kosh, koshMembership } from "@kosh-app/db/schema/kosh";
import { TRPCError } from "@trpc/server";
import {
  and,
  desc,
  eq,
  getTableName,
  gt,
  inArray,
  isNotNull,
  isNull,
  lt,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { z } from "zod";

import {
  buildDirectKey,
  buildMessagePreview,
  markThreadRead,
  requireActiveKoshMembership,
  requireThreadAccess,
} from "../helpers/chat";
import { createNotifications } from "../helpers/notifications";
import { protectedProcedure, router } from "../index";

const koshIdSchema = z.uuid();
const threadIdSchema = z.uuid();
const messageIdSchema = z.uuid();

const RECENT_LIMIT_DEFAULT = 50;
const HISTORY_LIMIT_DEFAULT = 30;

/**
 * Renders a `chat_thread` column fully qualified, for use inside raw `sql`.
 *
 * A bare `${chatThread.id}` inside a `sql` fragment renders as an unqualified
 * `"id"`, which Postgres resolves against the *subquery's* own table. That
 * silently turns a correlated `p.thread_id = p.id`, which is simply never true
 * - no error, just wrong results. And in this query's WHERE, an unqualified
 * `created_at` is outright ambiguous because `kosh` has one too. Deriving the
 * name from the table object keeps it correct and rename-safe.
 */
const ct = (column: { name: string }) =>
  sql.raw(`"${getTableName(chatThread)}"."${column.name}"`);

const CT_ID = ct(chatThread.id);

/**
 * The thread list's sort key, in epoch milliseconds: most recent activity,
 * falling back to the thread's own creation time.
 *
 * `last_message_at` is NULL until a thread's first message, so ordering by it
 * alone means keyset pagination has to encode a NULLS LAST branch and the cursor
 * is not comparable. COALESCE gives one never-null, monotonic value, and has the
 * pleasant side effect of ranking a brand-new empty thread by recency instead of
 * pinning it to the bottom of the list.
 *
 * Deliberately an integer rather than a timestamp: the cursor round-trips
 * through JS, and a `timestamp` value handed back to node-postgres would be
 * re-serialised against the *server's* local timezone, which can shift the
 * page boundary. Comparing integers on both sides cannot drift.
 */
const SORT_KEY_MS = sql<string>`(
  EXTRACT(EPOCH FROM COALESCE(
    ${ct(chatThread.lastMessageAt)},
    ${ct(chatThread.createdAt)}
  )) * 1000
)::bigint`;

const listThreadsSchema = z.object({
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.string().nullable().optional(),
});

export type ChatAttachment = {
  url: string;
  name?: string;
  size?: number;
  mimeType?: string;
};

const attachmentSchema = z.object({
  url: z.url().max(2048),
  name: z.string().max(255).optional(),
  size: z
    .number()
    .int()
    .nonnegative()
    .max(25 * 1024 * 1024)
    .optional(),
  mimeType: z.string().max(128).optional(),
});

export type ChatMessageItem = {
  id: string;
  threadId: string;
  senderId: string;
  clientId: string | null;
  type: "text" | "image" | "file" | "system";
  content: string | null;
  attachments: ChatAttachment[] | null;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  sender: { id: string; name: string; image: string | null };
  replyTo: {
    id: string;
    senderId: string;
    senderName: string;
    content: string | null;
    deletedAt: string | null;
  } | null;
  reactions: { emoji: string; userIds: string[] }[];
};

/** One row of the kosh roster behind a thread. */
export type ChatMemberItem = {
  userId: string;
  name: string | null;
  image: string | null;
  role: "adhyaksh" | "koshadhyaksh" | "sadasya";
  joinedAt: string | null;
};

/** One file in the thread's attachment grid, flattened out of its message. */
export type ChatAttachmentItem = {
  /** `${messageId}:${url}` - unique, and stable across pages. */
  key: string;
  messageId: string;
  url: string;
  name: string | null;
  size: number | null;
  mimeType: string | null;
  isImage: boolean;
  createdAt: string;
  sender: { id: string; name: string | null; image: string | null };
};

export type ChatThreadListItem = {
  id: string;
  type: "group" | "direct";
  koshId: string;
  koshName: string;
  /** Group: the kosh name. Direct: the other member's name. */
  title: string;
  /** Group: "N members". Direct: the other member's role. */
  subtitle: string | null;
  avatarUrl: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  lastMessageSenderName: string | null;
  unreadCount: number;
  participantCount: number;
};

export type ChatThreadHeader = {
  id: string;
  type: "group" | "direct";
  koshId: string;
  koshName: string;
  title: string;
  subtitle: string | null;
  avatarUrl: string | null;
  participantCount: number;
};

const ROLE_LABEL: Record<string, string> = {
  adhyaksh: "Adhyaksh",
  koshadhyaksh: "Koshadhyaksh",
  sadasya: "Sadasya",
};

const messageQueryConfig = {
  columns: {
    id: true,
    threadId: true,
    senderId: true,
    clientId: true,
    type: true,
    content: true,
    attachments: true,
    createdAt: true,
    editedAt: true,
    deletedAt: true,
  },
  with: {
    sender: { columns: { id: true, name: true, image: true } },
    replyTo: {
      columns: { id: true, senderId: true, content: true, deletedAt: true },
      with: { sender: { columns: { name: true } } },
    },
    reactions: {
      columns: { emoji: true, userId: true },
    },
  },
} as const;

type MessageRow = {
  id: string;
  threadId: string;
  senderId: string;
  clientId: string | null;
  type: "text" | "image" | "file" | "system";
  content: string | null;
  attachments: unknown;
  createdAt: Date;
  editedAt: Date | null;
  deletedAt: Date | null;
  sender: { id: string; name: string; image: string | null };
  replyTo: {
    id: string;
    senderId: string;
    content: string | null;
    deletedAt: Date | null;
    sender: { name: string };
  } | null;
  reactions: { emoji: string; userId: string }[];
};

function toMessageItem(row: MessageRow): ChatMessageItem {
  const byEmoji = new Map<string, string[]>();
  for (const reaction of row.reactions) {
    const list = byEmoji.get(reaction.emoji);
    if (list) list.push(reaction.userId);
    else byEmoji.set(reaction.emoji, [reaction.userId]);
  }

  return {
    id: row.id,
    threadId: row.threadId,
    senderId: row.senderId,
    clientId: row.clientId,
    type: row.type,
    // A soft-deleted message keeps its slot in the transcript but gives up
    // its content, so it can never leak through a stale cache.
    content: row.deletedAt ? null : row.content,
    attachments: row.deletedAt
      ? null
      : (row.attachments as ChatAttachment[] | null),
    createdAt: row.createdAt.toISOString(),
    editedAt: row.editedAt?.toISOString() ?? null,
    deletedAt: row.deletedAt?.toISOString() ?? null,
    sender: row.sender,
    replyTo: row.replyTo
      ? {
          id: row.replyTo.id,
          senderId: row.replyTo.senderId,
          senderName: row.replyTo.sender.name,
          content: row.replyTo.deletedAt ? null : row.replyTo.content,
          deletedAt: row.replyTo.deletedAt?.toISOString() ?? null,
        }
      : null,
    reactions: [...byEmoji.entries()].map(([emoji, userIds]) => ({
      emoji,
      userIds,
    })),
  };
}

/** Loads one message fully hydrated, for returning it straight after a write. */
async function loadMessageItem(messageId: string) {
  const row = await db.query.chatMessage.findFirst({
    where: (m, { eq: q }) => q(m.id, messageId),
    ...messageQueryConfig,
  });
  return row ? toMessageItem(row as MessageRow) : null;
}

/** Keyset cursor shape: `${createdAt.getTime()}|${id}`. */
function decodeCursor(cursor: string | null | undefined) {
  if (!cursor)
    return { epoch: null as number | null, id: null as string | null };
  const [rawEpoch, id] = cursor.split("|", 2);
  const epoch = Number(rawEpoch);
  if (!id || Number.isNaN(epoch)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid pagination cursor",
    });
  }
  return { epoch, id };
}

export const chatRouter = router({
  /**
   * A page of threads the caller participates in, across all of their koshes -
   * the plan is explicit that a member of 3 koshes sees 3 permanent group chats
   * regardless of which kosh is currently active.
   *
   * Keyset-paginated on `SORT_KEY DESC, id DESC`. The tiebreak on `id` is what
   * makes it correct: two threads can share a sort key (same millisecond, or
   * both empty and created together), and without a unique second column the
   * cursor would silently skip or repeat a row at the page boundary.
   */
  listThreads: protectedProcedure
    .input(listThreadsSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { limit } = input;
      const { epoch, id: cursorId } = decodeCursor(input.cursor);
      // Epoch milliseconds, compared against SORT_KEY_MS on both sides.
      const cursorMs = epoch;

      const cursorFilter =
        cursorMs !== null && cursorId
          ? or(
              lt(SORT_KEY_MS, cursorMs),
              and(eq(SORT_KEY_MS, cursorMs), lt(CT_ID, cursorId)),
            )
          : undefined;

      const rows = await db
        .select({
          id: chatThread.id,
          type: chatThread.type,
          koshId: chatThread.koshId,
          koshName: kosh.name,
          koshIconUrl: kosh.iconUrl,
          lastMessageAt: chatThread.lastMessageAt,
          lastMessagePreview: chatThread.lastMessagePreview,
          lastReadAt: chatThreadParticipant.lastReadAt,
          sortKeyMs: SORT_KEY_MS,
          // Correlated subqueries are built with the query builder, not raw
          // `sql`. In a raw fragment `${chatThread.id}` renders as a bare "id",
          // which Postgres resolves against the subquery's own table - silently
          // turning `p.thread_id = p.id` and returning wrong counts.
          participantCount: db.$count(
            chatThreadParticipant,
            eq(chatThreadParticipant.threadId, chatThread.id),
          ),
          unreadCount: db.$count(
            chatMessage,
            and(
              eq(chatMessage.threadId, chatThread.id),
              ne(chatMessage.senderId, userId),
              isNull(chatMessage.deletedAt),
              gt(
                chatMessage.createdAt,
                sql`COALESCE(${chatThreadParticipant.lastReadAt}, '-infinity'::timestamp)`,
              ),
            ),
          ),
          lastMessageSenderName: sql<string | null>`(
            SELECT u.name FROM chat_message m
            JOIN "user" u ON u.id = m.sender_id
            WHERE m.thread_id = ${CT_ID}
              AND m.deleted_at IS NULL
            ORDER BY m.created_at DESC, m.id DESC
            LIMIT 1
          )`,
        })
        .from(chatThread)
        .innerJoin(kosh, eq(chatThread.koshId, kosh.id))
        .innerJoin(
          chatThreadParticipant,
          and(
            eq(chatThreadParticipant.threadId, chatThread.id),
            eq(chatThreadParticipant.userId, userId),
          ),
        )
        // Deliberately independent of the participant row above: a removed or
        // departed member keeps that row but must not see the thread at all.
        .innerJoin(
          koshMembership,
          and(
            eq(koshMembership.koshId, chatThread.koshId),
            eq(koshMembership.userId, userId),
            eq(koshMembership.status, "active"),
          ),
        )
        .where(cursorFilter)
        .orderBy(desc(SORT_KEY_MS), desc(CT_ID))
        // One extra row is how `hasNextPage` is determined; trimming to `limit`
        // happens below.
        .limit(limit + 1);

      const hasNextPage = rows.length > limit;
      const page = hasNextPage ? rows.slice(0, limit) : rows;
      const last = page.at(-1);

      const directRows = page.filter((r) => r.type === "direct");
      const otherByThread = new Map<
        string,
        { name: string; image: string | null; role: string | null }
      >();

      if (directRows.length > 0) {
        const koshIdByThread = new Map(directRows.map((r) => [r.id, r.koshId]));

        const others = await db.query.chatThreadParticipant.findMany({
          where: and(
            inArray(
              chatThreadParticipant.threadId,
              directRows.map((r) => r.id),
            ),
            ne(chatThreadParticipant.userId, userId),
          ),
          columns: { threadId: true, userId: true },
          with: { user: { columns: { name: true, image: true } } },
        });

        const roleRows = await db
          .select({
            koshId: koshMembership.koshId,
            userId: koshMembership.userId,
            role: koshMembership.role,
          })
          .from(koshMembership)
          .where(
            and(
              inArray(
                koshMembership.koshId,
                directRows.map((r) => r.koshId),
              ),
              inArray(
                koshMembership.userId,
                others.map((o) => o.userId),
              ),
              eq(koshMembership.status, "active"),
            ),
          );

        const roleByUser = new Map(
          roleRows.map((r) => [`${r.koshId}:${r.userId}`, r.role]),
        );

        for (const other of others) {
          const koshId = koshIdByThread.get(other.threadId);
          const role = koshId
            ? roleByUser.get(`${koshId}:${other.userId}`)
            : null;
          otherByThread.set(other.threadId, {
            name: other.user.name,
            image: other.user.image,
            role: role ?? null,
          });
        }
      }

      const items = page.map((row): ChatThreadListItem => {
        const other =
          row.type === "direct" ? otherByThread.get(row.id) : undefined;

        return {
          id: row.id,
          type: row.type,
          koshId: row.koshId,
          koshName: row.koshName,
          title: other?.name ?? row.koshName,
          subtitle:
            row.type === "direct"
              ? other?.role
                ? (ROLE_LABEL[other.role] ?? other.role)
                : row.koshName
              : `${row.participantCount} members`,
          avatarUrl: other?.image ?? row.koshIconUrl,
          lastMessageAt: row.lastMessageAt?.toISOString() ?? null,
          lastMessagePreview: row.lastMessagePreview,
          lastMessageSenderName: row.lastMessageSenderName,
          unreadCount: row.unreadCount,
          participantCount: row.participantCount,
        };
      });

      return {
        items,
        nextCursor: hasNextPage && last ? `${last.sortKeyMs}|${last.id}` : null,
      };
    }),

  /**
   * Total unread across every thread, for the tab badge.
   *
   * Deliberately separate from `listThreads`: the list is paginated, so summing
   * its loaded pages would undercount the badge as soon as a user has more
   * threads than fit in one page. This is a single count with no row payload,
   * so the badge stays cheap regardless of how many threads exist.
   */
  unreadTotal: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Driven from `chat_message` outwards, with a real join to the thread, and
    // counting inline. Both of the obvious alternatives are silently wrong:
    //
    //   - `select().from(chatThread).innerJoin(participant)` with
    //     `db.$count(chatMessage, filter)` renders the filter as a subquery
    //     correlated only on `last_read_at`, so it sweeps up messages from every
    //     thread and kosh, and the outer select returns one row per thread of
    //     which `row` keeps only the first.
    //   - `db.$count(chatMessage)` with no filter renders
    //     `(select count(*) from "chat_message")` - uncorrelated, so it reports
    //     the size of the whole table and ignores the joins and WHERE entirely.
    //
    // An inline `count(*)` over the joined rows is the only one of the three
    // that actually means "unread messages in threads this user is in".
    const [row] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(chatMessage)
      .innerJoin(chatThread, eq(chatMessage.threadId, chatThread.id))
      .innerJoin(
        chatThreadParticipant,
        and(
          eq(chatThreadParticipant.threadId, chatThread.id),
          eq(chatThreadParticipant.userId, userId),
        ),
      )
      .innerJoin(
        koshMembership,
        and(
          eq(koshMembership.koshId, chatThread.koshId),
          eq(koshMembership.userId, userId),
          eq(koshMembership.status, "active"),
        ),
      )
      .where(
        and(
          // Someone else's message. A NULL sender (a system row) is not
          // `= userId`, so it is not counted as self-sent.
          ne(chatMessage.senderId, userId),
          isNull(chatMessage.deletedAt),
          gt(
            chatMessage.createdAt,
            sql`COALESCE(${chatThreadParticipant.lastReadAt}, '-infinity'::timestamp)`,
          ),
        ),
      );

    return row?.total ?? 0;
  }),

  /** Header data for a single thread - covers opening one by deep link. */
  getThread: protectedProcedure
    .input(z.object({ threadId: threadIdSchema }))
    .query(async ({ ctx, input }) => {
      await requireThreadAccess(input.threadId, ctx.session.user.id);

      const row = await db.query.chatThread.findFirst({
        where: (t, { eq: q }) => q(t.id, input.threadId),
        columns: { id: true, type: true, koshId: true },
        with: { kosh: { columns: { name: true, iconUrl: true } } },
      });
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Thread not found" });
      }

      const participants = await db.query.chatThreadParticipant.findMany({
        where: (p, { eq: q }) => q(p.threadId, input.threadId),
        columns: { userId: true },
        with: { user: { columns: { name: true, image: true } } },
      });

      const other =
        row.type === "direct"
          ? participants.find((p) => p.userId !== ctx.session.user.id)
          : undefined;

      const role = other
        ? (
            await db.query.koshMembership.findFirst({
              where: (m, { and: a, eq: q }) =>
                a(
                  q(m.koshId, row.koshId),
                  q(m.userId, other.userId),
                  q(m.status, "active"),
                ),
              columns: { role: true },
            })
          )?.role
        : null;

      return {
        id: row.id,
        type: row.type,
        koshId: row.koshId,
        koshName: row.kosh?.name ?? "",
        title: other?.user.name ?? row.kosh?.name ?? "Chat",
        subtitle:
          row.type === "direct" && role
            ? (ROLE_LABEL[role] ?? role)
            : (row.kosh?.name ?? null),
        avatarUrl: other?.user.image ?? row.kosh?.iconUrl ?? null,
        participantCount: participants.length,
      } satisfies ChatThreadHeader;
    }),

  /**
   * The live tail of a thread. This - not the paginated history - is what
   * polls, so opening a long conversation never re-fetches its whole backlog.
   */
  recent: protectedProcedure
    .input(
      z.object({
        threadId: threadIdSchema,
        limit: z.number().int().min(1).max(100).default(RECENT_LIMIT_DEFAULT),
      }),
    )
    .query(async ({ ctx, input }) => {
      await requireThreadAccess(input.threadId, ctx.session.user.id);

      const rows = await db.query.chatMessage.findMany({
        where: (m, { eq: q }) => q(m.threadId, input.threadId),
        ...messageQueryConfig,
        orderBy: (m, { desc: d }) => [d(m.createdAt), d(m.id)],
        limit: input.limit,
      });

      // Newest-first is the efficient read order; render order is oldest-first.
      return (rows as MessageRow[]).reverse().map(toMessageItem);
    }),

  /** Older history, walked backwards with a keyset cursor on (createdAt, id). */
  messages: protectedProcedure
    .input(
      z.object({
        threadId: threadIdSchema,
        cursor: z.string().nullable().optional(),
        limit: z.number().int().min(1).max(100).default(HISTORY_LIMIT_DEFAULT),
      }),
    )
    .query(async ({ ctx, input }) => {
      await requireThreadAccess(input.threadId, ctx.session.user.id);

      const { epoch, id } = decodeCursor(input.cursor);
      const boundary = epoch === null ? null : new Date(epoch);

      const rows = await db.query.chatMessage.findMany({
        where: (m, { and: a, eq: q, lt: l, or: o }) =>
          boundary && id
            ? a(
                q(m.threadId, input.threadId),
                o(
                  l(m.createdAt, boundary),
                  a(q(m.createdAt, boundary), l(m.id, id)),
                ),
              )
            : q(m.threadId, input.threadId),
        ...messageQueryConfig,
        orderBy: (m, { desc: d }) => [d(m.createdAt), d(m.id)],
        limit: input.limit + 1,
      });

      const hasMore = rows.length > input.limit;
      const page = (
        hasMore ? rows.slice(0, input.limit) : rows
      ) as MessageRow[];
      const oldest = page[page.length - 1];

      return {
        items: page.reverse().map(toMessageItem),
        hasMore,
        nextCursor:
          hasMore && oldest
            ? `${oldest.createdAt.getTime()}|${oldest.id}`
            : null,
      };
    }),

  /**
   * The active kosh roster behind a thread.
   *
   * Keyset cursor is `(role, userId)`, not `joinedAt`: `kosh_membership.
   * joined_at` is nullable, and in Postgres a NULL fails every `>` comparison,
   * so a joinedAt cursor would silently drop un-joined members from page 2
   * onwards. `member_role` is an enum, and `>` compares by declaration order
   * (adhyaksh, koshadhyaksh, sadasya) - the order a roster wants anyway.
   *
   * Scoped to the thread's kosh, not its participants: the point of the screen
   * is "who is in this kosh", which for a group chat is a different and larger
   * set than the thread's participants.
   */
  members: protectedProcedure
    .input(
      z.object({
        threadId: threadIdSchema,
        cursor: z.string().nullable().optional(),
        limit: z.number().int().min(1).max(100).default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { koshId } = await requireThreadAccess(
        input.threadId,
        ctx.session.user.id,
      );

      // Read from the cursor rather than an offset, so "first page" stays
      // correct however deep the client has paged.
      const isFirstPage = !input.cursor;

      const [cursorRole, cursorUserId] = input.cursor?.split("|", 2) ?? [];
      const after =
        cursorRole && cursorUserId
          ? or(
              gt(koshMembership.role, cursorRole as ChatMemberItem["role"]),
              and(
                eq(koshMembership.role, cursorRole as ChatMemberItem["role"]),
                gt(koshMembership.userId, cursorUserId),
              ),
            )
          : undefined;

      const rows = await db.query.koshMembership.findMany({
        where: (m, { and: a, eq: q }) =>
          a(q(m.koshId, koshId), q(m.status, "active"), after),
        columns: { userId: true, role: true, joinedAt: true },
        with: { user: { columns: { id: true, name: true, image: true } } },
        orderBy: (m, { asc: s }) => [s(m.role), s(m.userId)],
        limit: input.limit + 1,
      });

      const hasMore = rows.length > input.limit;
      const page = hasMore ? rows.slice(0, input.limit) : rows;
      const last = page[page.length - 1];

      // Roster size for the screen title. Counted on the first page only and
      // the client reads it off `pages[0]`, so paging in never re-counts. The
      // same predicate as the page query, or the number would disagree with
      // the list it labels.
      const [countRow] = isFirstPage
        ? await db
            .select({ n: sql<number>`count(*)::int` })
            .from(koshMembership)
            .where(
              and(
                eq(koshMembership.koshId, koshId),
                eq(koshMembership.status, "active"),
              ),
            )
        : [];
      const total = isFirstPage ? (countRow?.n ?? 0) : null;

      const items: ChatMemberItem[] = page.map((m) => ({
        userId: m.userId,
        name: m.user.name,
        image: m.user.image,
        role: m.role,
        joinedAt: m.joinedAt?.toISOString() ?? null,
      }));

      return {
        items,
        hasMore,
        nextCursor: hasMore && last ? `${last.role}|${last.userId}` : null,
        total,
      };
    }),

  /**
   * Every attachment shared in a thread, newest first, for the media grid.
   *
   * The keyset cursor rides on the *message* `(createdAt, id)`, not on the
   * attachment, so a page is a page of messages: one image message yields one
   * item, a five-file message yields five. That keeps the cursor advancing even
   * in the degenerate case where a page flattens down to zero items, which
   * would otherwise strand the client on an empty page that never looks full.
   */
  attachments: protectedProcedure
    .input(
      z.object({
        threadId: threadIdSchema,
        cursor: z.string().nullable().optional(),
        limit: z.number().int().min(1).max(100).default(HISTORY_LIMIT_DEFAULT),
      }),
    )
    .query(async ({ ctx, input }) => {
      await requireThreadAccess(input.threadId, ctx.session.user.id);

      // Counted on the first page only, for the screen title, and read off
      // `pages[0]` by the client. Derived from the cursor rather than an
      // offset so it stays correct however deep the client has paged.
      const isFirstPage = !input.cursor;
      const { epoch, id } = decodeCursor(input.cursor);
      const boundary = epoch === null ? null : new Date(epoch);

      const rows = await db.query.chatMessage.findMany({
        where: (m, { and: a, eq: q, isNull: n, isNotNull: nn, or: o, lt: l }) =>
          a(
            q(m.threadId, input.threadId),
            nn(m.attachments),
            // A tombstone is excluded twice over. deleteMessage nulls the
            // attachments, but the deletedAt guard also keeps a soft-deleted
            // message out of the grid if that ever stops being true.
            n(m.deletedAt),
            boundary && id
              ? o(
                  l(m.createdAt, boundary),
                  a(q(m.createdAt, boundary), l(m.id, id)),
                )
              : undefined,
          ),
        columns: {
          id: true,
          senderId: true,
          type: true,
          attachments: true,
          createdAt: true,
        },
        with: { sender: { columns: { id: true, name: true, image: true } } },
        orderBy: (m, { desc: d }) => [d(m.createdAt), d(m.id)],
        limit: input.limit + 1,
      });

      const hasMore = rows.length > input.limit;
      const page = hasMore ? rows.slice(0, input.limit) : rows;
      const oldest = page[page.length - 1];

      // `sum(jsonb_array_length(...))`, not a count of messages: the list is
      // one row per file, so a message carrying three attachments contributes
      // three tiles. Counting messages would understate the title. The
      // predicates mirror the page query exactly - same thread, same non-null
      // attachments, same tombstone exclusion - or the two disagree.
      const [countRow] = isFirstPage
        ? await db
            .select({
              n: sql<number>`coalesce(sum(jsonb_array_length(${chatMessage.attachments})), 0)::int`,
            })
            .from(chatMessage)
            .where(
              and(
                eq(chatMessage.threadId, input.threadId),
                isNotNull(chatMessage.attachments),
                isNull(chatMessage.deletedAt),
              ),
            )
        : [];
      const total = isFirstPage ? (countRow?.n ?? 0) : null;

      const items: ChatAttachmentItem[] = page.flatMap((row) =>
        ((row.attachments ?? []) as ChatAttachment[]).map((attachment) => ({
          key: `${row.id}:${attachment.url}`,
          messageId: row.id,
          url: attachment.url,
          name: attachment.name ?? null,
          size: attachment.size ?? null,
          mimeType: attachment.mimeType ?? null,
          isImage:
            row.type === "image" ||
            attachment.mimeType?.startsWith("image/") === true,
          createdAt: row.createdAt.toISOString(),
          sender: {
            id: row.senderId,
            name: row.sender.name,
            image: row.sender.image,
          },
        })),
      );

      return {
        items,
        hasMore,
        // Derived from the last *row*, not the last item, so an empty page
        // still hands back a cursor that moves forward.
        nextCursor:
          hasMore && oldest
            ? `${oldest.createdAt.getTime()}|${oldest.id}`
            : null,
        total,
      };
    }),

  /**
   * Find-or-create the DM thread for a pair *within one kosh*. Two people who
   * share three koshes get three separate threads - the `direct_key` unique
   * index is what makes that race-safe.
   */
  getOrCreateDirectThread: protectedProcedure
    .input(z.object({ koshId: koshIdSchema, userId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const me = ctx.session.user.id;
      if (input.userId === me) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot start a chat with yourself",
        });
      }

      await requireActiveKoshMembership(input.koshId, me);
      await requireActiveKoshMembership(input.koshId, input.userId);

      const directKey = buildDirectKey(input.koshId, me, input.userId);

      const [inserted] = await db
        .insert(chatThread)
        .values({ koshId: input.koshId, type: "direct", directKey })
        .onConflictDoNothing({ target: chatThread.directKey })
        .returning({ id: chatThread.id });

      const threadId =
        inserted?.id ??
        (
          await db.query.chatThread.findFirst({
            where: (t, { eq: q }) => q(t.directKey, directKey),
            columns: { id: true },
          })
        )?.id;

      if (!threadId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not open this chat",
        });
      }

      await db
        .insert(chatThreadParticipant)
        .values([
          { threadId, userId: me },
          { threadId, userId: input.userId },
        ])
        .onConflictDoNothing({
          target: [
            chatThreadParticipant.threadId,
            chatThreadParticipant.userId,
          ],
        });

      return { threadId };
    }),

  send: protectedProcedure
    .input(
      z.object({
        threadId: threadIdSchema,
        clientId: z.string().min(1).max(64),
        content: z.string().trim().max(4000).optional(),
        type: z.enum(["text", "image", "file"]).default("text"),
        attachments: z.array(attachmentSchema).max(5).optional(),
        replyToId: messageIdSchema.nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const senderId = ctx.session.user.id;
      const thread = await requireThreadAccess(input.threadId, senderId);

      const content = input.content?.trim() || null;
      const attachments = input.attachments?.length ? input.attachments : null;

      if (!content && !attachments) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Message is empty",
        });
      }
      if (input.type !== "text" && !attachments) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Attachment is missing",
        });
      }

      if (input.replyToId) {
        const replyToId = input.replyToId;
        const target = await db.query.chatMessage.findFirst({
          where: (m, { and: a, eq: q }) =>
            a(q(m.id, replyToId), q(m.threadId, input.threadId)),
          columns: { id: true },
        });
        if (!target) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "The message you are replying to is no longer available",
          });
        }
      }

      const sender = ctx.session.user;
      const preview = buildMessagePreview(
        input.type,
        content,
        attachments?.length ?? 0,
      );
      const now = new Date();

      const { row, created } = await db.transaction(async (tx) => {
        const inserted = await tx
          .insert(chatMessage)
          .values({
            threadId: input.threadId,
            senderId,
            replyToId: input.replyToId ?? null,
            type: input.type,
            content,
            attachments,
            clientId: input.clientId,
            createdAt: now,
          })
          // Retrying reuses the clientId, and a client can legitimately retry
          // after a failure that happened *after* the row committed. Without
          // this the retry would trip the (sender_id, client_id) unique index
          // and surface as a duplicate-key error for a message that in fact
          // went through.
          .onConflictDoNothing({
            target: [chatMessage.senderId, chatMessage.clientId],
            // The unique index is partial, so Postgres can only infer it as the
            // arbiter if ON CONFLICT repeats the same predicate.
            where: sql`${chatMessage.clientId} is not null`,
          })
          .returning();

        const [insertedRow] = inserted;

        // Already sent under this clientId, so this is a retry. Return the
        // original row and skip the side effects below: they already ran on the
        // first attempt, and repeating them would push the thread's
        // lastMessageAt forward for a message that is not new, and re-notify
        // everyone about it.
        if (!insertedRow) {
          const [existing] = await tx
            .select({ id: chatMessage.id })
            .from(chatMessage)
            .where(
              and(
                eq(chatMessage.senderId, senderId),
                eq(chatMessage.clientId, input.clientId),
              ),
            )
            .limit(1);
          return { row: existing ?? null, created: false };
        }

        await tx
          .update(chatThread)
          .set({ lastMessageAt: now, lastMessagePreview: preview })
          .where(eq(chatThread.id, input.threadId));

        // Sending counts as reading, so your own message never shows up as unread.
        await tx
          .update(chatThreadParticipant)
          .set({ lastReadAt: now })
          .where(
            and(
              eq(chatThreadParticipant.threadId, input.threadId),
              eq(chatThreadParticipant.userId, senderId),
            ),
          );

        return { row: insertedRow, created: true };
      });

      if (!row) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Message could not be sent",
        });
      }

      if (created) {
        const recipients = await db
          .select({ userId: chatThreadParticipant.userId })
          .from(chatThreadParticipant)
          .where(eq(chatThreadParticipant.threadId, input.threadId));

        const others = recipients
          .map((r) => r.userId)
          .filter((id) => id !== senderId);

        if (others.length > 0) {
          const koshRow = await db.query.kosh.findFirst({
            where: (k, { eq: q }) => q(k.id, thread.koshId),
            columns: { name: true },
          });

          await createNotifications(
            db,
            others.map((userId) => ({
              userId,
              koshId: thread.koshId,
              type: "chat_message" as const,
              title:
                thread.type === "direct"
                  ? sender.name
                  : `${sender.name} · ${koshRow?.name ?? "Kosh"}`,
              body: preview,
              data: {
                koshId: thread.koshId,
                threadId: input.threadId,
                screen: "chat",
                messageId: row.id,
              },
            })),
          );
        }
      }

      // Returned hydrated so the optimistic row can be swapped for the real
      // one immediately, instead of waiting out the next poll.
      return { message: await loadMessageItem(row.id) };
    }),

  editMessage: protectedProcedure
    .input(
      z.object({
        messageId: messageIdSchema,
        content: z.string().trim().min(1).max(4000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const row = await requireOwnMessage(input.messageId, ctx.session.user.id);
      if (row.type !== "text") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only text messages can be edited",
        });
      }

      await db
        .update(chatMessage)
        .set({ content: input.content, editedAt: new Date() })
        .where(eq(chatMessage.id, row.id));

      await refreshThreadPreview(row.threadId);

      return { message: await loadMessageItem(row.id) };
    }),

  deleteMessage: protectedProcedure
    .input(z.object({ messageId: messageIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const row = await requireOwnMessage(input.messageId, ctx.session.user.id);

      await db
        .update(chatMessage)
        .set({ content: null, attachments: null, deletedAt: new Date() })
        .where(eq(chatMessage.id, row.id));

      // Reactions have to go with the message. A tombstone that keeps its
      // reaction chips is a half-deleted row: it leaks that someone reacted to
      // content nobody can read any more, and it leaves the chips on screen for
      // every other member until the row is hard-deleted.
      await db
        .delete(chatMessageReaction)
        .where(eq(chatMessageReaction.messageId, row.id));

      await refreshThreadPreview(row.threadId);

      return { id: row.id, message: await loadMessageItem(row.id) };
    }),

  /** Adds the reaction if absent, removes it if already present. */
  toggleReaction: protectedProcedure
    .input(
      z.object({
        messageId: messageIdSchema,
        emoji: z.string().min(1).max(16),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const message = await db.query.chatMessage.findFirst({
        where: (m, { eq: q }) => q(m.id, input.messageId),
        columns: { id: true, threadId: true, deletedAt: true },
      });
      if (!message) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found",
        });
      }
      if (message.deletedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This message was deleted",
        });
      }
      await requireThreadAccess(message.threadId, ctx.session.user.id);

      const removed = await db
        .delete(chatMessageReaction)
        .where(
          and(
            eq(chatMessageReaction.messageId, input.messageId),
            eq(chatMessageReaction.userId, ctx.session.user.id),
            eq(chatMessageReaction.emoji, input.emoji),
          ),
        )
        .returning({ id: chatMessageReaction.id });

      if (removed.length === 0) {
        await db
          .insert(chatMessageReaction)
          .values({
            messageId: input.messageId,
            userId: ctx.session.user.id,
            emoji: input.emoji,
          })
          .onConflictDoNothing();
      }

      return { reacted: removed.length === 0, emoji: input.emoji };
    }),

  markRead: protectedProcedure
    .input(z.object({ threadId: threadIdSchema }))
    .mutation(async ({ ctx, input }) => {
      await requireThreadAccess(input.threadId, ctx.session.user.id);
      await markThreadRead(input.threadId, ctx.session.user.id);
      return { ok: true };
    }),
});

async function requireOwnMessage(messageId: string, userId: string) {
  const row = await db.query.chatMessage.findFirst({
    where: (m, { eq: q }) => q(m.id, messageId),
    columns: {
      id: true,
      threadId: true,
      senderId: true,
      type: true,
      deletedAt: true,
    },
  });

  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Message not found" });
  }
  if (row.senderId !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You can only change your own messages",
    });
  }
  if (row.deletedAt) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This message was deleted",
    });
  }

  return row;
}

/**
 * Re-derives the denormalised thread preview from the newest surviving message.
 * Needed after edits and deletes, which can change or remove the last message
 * and would otherwise leave a stale preview in the thread list.
 */
async function refreshThreadPreview(threadId: string) {
  const [latest] = await db
    .select({
      type: chatMessage.type,
      content: chatMessage.content,
      attachments: chatMessage.attachments,
      createdAt: chatMessage.createdAt,
    })
    .from(chatMessage)
    .where(
      and(eq(chatMessage.threadId, threadId), isNull(chatMessage.deletedAt)),
    )
    .orderBy(desc(chatMessage.createdAt), desc(chatMessage.id))
    .limit(1);

  if (!latest) {
    await db
      .update(chatThread)
      .set({ lastMessageAt: null, lastMessagePreview: null })
      .where(eq(chatThread.id, threadId));
    return;
  }

  const count = Array.isArray(latest.attachments)
    ? latest.attachments.length
    : 0;

  await db
    .update(chatThread)
    .set({
      lastMessageAt: latest.createdAt,
      lastMessagePreview: buildMessagePreview(
        latest.type,
        latest.content,
        count,
      ),
    })
    .where(eq(chatThread.id, threadId));
}
