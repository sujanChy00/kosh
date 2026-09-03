import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
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
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    data: jsonb("data"), // deep-link target, e.g. { koshId, screen }
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notification_user_id_idx").on(table.userId),
    index("notification_read_at_idx").on(table.userId, table.readAt),
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
}));
