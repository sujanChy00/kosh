import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { kosh } from "./kosh";
import { platformEnum, notificationTypeEnum } from "./enums";

// ─── Push Tokens ────────────────────────────────────────────────────────────
export const pushToken = pgTable(
  "push_token",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    expoPushToken: text("expo_push_token").notNull().unique(),
    deviceId: text("device_id"), // distinguishes multiple devices per user
    platform: platformEnum("platform").notNull(),
    lastUsedAt: timestamp("last_used_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("push_token_user_id_idx").on(table.userId)],
);

// ─── Notifications ──────────────────────────────────────────────────────────
export const notification = pgTable(
  "notification",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    koshId: uuid("kosh_id").references(() => kosh.id, {
      onDelete: "cascade",
    }), // null for account-scoped notifications (e.g. security alerts)
    type: notificationTypeEnum("type").notNull(),
    requiresAction: boolean("requires_action").notNull().default(false),
    title: text("title").notNull(),
    body: text("body").notNull(),
    data: jsonb("data"), // deep-link target, e.g. { koshId, screen }
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notification_user_id_idx").on(table.userId),
    index("notification_kosh_id_idx").on(table.koshId),
    index("notification_read_at_idx").on(table.userId, table.readAt),
    index("notification_type_idx").on(table.type),
    /**
     * Backs the in-app notification feed, which is one row per thread: it
     * partitions by `data->>'threadId'` and takes the newest row in each
     * partition.
     *
     * The thread id lives in a jsonb payload, so no index on the table's own
     * columns can serve that grouping - without this the feed degrades into a
     * full scan of every notification the user has ever received, on every poll.
     *
     * Partial on `chat_message` because that is the only type the feed reads
     * today; the predicate keeps the other types out of the index entirely.
     */
    index("notification_chat_feed_idx")
      .on(table.userId, sql`(data->>'threadId')`, table.createdAt.desc())
      .where(sql`${table.type} = 'chat_message'`),
  ],
);

// ─── Relations ──────────────────────────────────────────────────────────────

export const pushTokenRelations = relations(pushToken, ({ one }) => ({
  user: one(user, {
    fields: [pushToken.userId],
    references: [user.id],
  }),
}));

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, {
    fields: [notification.userId],
    references: [user.id],
  }),
  kosh: one(kosh, {
    fields: [notification.koshId],
    references: [kosh.id],
  }),
}));
