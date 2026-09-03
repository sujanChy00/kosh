import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { kosh } from "./kosh";
import { chatThreadTypeEnum } from "./enums";

// ─── Chat Threads ───────────────────────────────────────────────────────────
export const chatThread = pgTable(
  "chat_thread",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    koshId: uuid("kosh_id")
      .notNull()
      .references(() => kosh.id, { onDelete: "cascade" }),
    type: chatThreadTypeEnum("type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("chat_thread_kosh_id_idx").on(table.koshId)],
);

// ─── Chat Thread Participants ───────────────────────────────────────────────
export const chatThreadParticipant = pgTable(
  "chat_thread_participant",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => chatThread.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
    lastReadAt: timestamp("last_read_at"), // for unread badges
  },
  (table) => [
    index("chat_participant_thread_id_idx").on(table.threadId),
    index("chat_participant_user_id_idx").on(table.userId),
  ],
);

// ─── Chat Messages ──────────────────────────────────────────────────────────
export const chatMessage = pgTable(
  "chat_message",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => chatThread.id, { onDelete: "cascade" }),
    senderId: text("sender_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    editedAt: timestamp("edited_at"),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("chat_message_thread_id_idx").on(table.threadId),
    index("chat_message_created_at_idx").on(table.threadId, table.createdAt),
  ],
);

// ─── Relations ──────────────────────────────────────────────────────────────

export const chatThreadRelations = relations(chatThread, ({ one, many }) => ({
  kosh: one(kosh, {
    fields: [chatThread.koshId],
    references: [kosh.id],
  }),
  participants: many(chatThreadParticipant),
  messages: many(chatMessage),
}));

export const chatThreadParticipantRelations = relations(
  chatThreadParticipant,
  ({ one }) => ({
    thread: one(chatThread, {
      fields: [chatThreadParticipant.threadId],
      references: [chatThread.id],
    }),
    user: one(user, {
      fields: [chatThreadParticipant.userId],
      references: [user.id],
    }),
  }),
);

export const chatMessageRelations = relations(chatMessage, ({ one }) => ({
  thread: one(chatThread, {
    fields: [chatMessage.threadId],
    references: [chatThread.id],
  }),
  sender: one(user, {
    fields: [chatMessage.senderId],
    references: [user.id],
  }),
}));
