import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { kosh } from "./kosh";
import { chatThreadTypeEnum, chatMessageTypeEnum } from "./enums";

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
    replyToId: uuid("reply_to_id"), // self-reference for message replies
    type: chatMessageTypeEnum("type").notNull().default("text"),
    content: text("content"), // optional if message contains media/attachments only
    attachments: jsonb("attachments"), // array of { url, name, size, mimeType }
    createdAt: timestamp("created_at").defaultNow().notNull(),
    editedAt: timestamp("edited_at"),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("chat_message_thread_id_idx").on(table.threadId),
    index("chat_message_created_at_idx").on(table.threadId, table.createdAt),
    index("chat_message_reply_to_id_idx").on(table.replyToId),
  ],
);

// ─── Chat Message Reactions ─────────────────────────────────────────────────
export const chatMessageReaction = pgTable(
  "chat_message_reaction",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    messageId: uuid("message_id")
      .notNull()
      .references(() => chatMessage.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("chat_reaction_message_id_idx").on(table.messageId),
    uniqueIndex("chat_reaction_message_user_emoji_uidx").on(
      table.messageId,
      table.userId,
      table.emoji,
    ),
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

export const chatMessageRelations = relations(chatMessage, ({ one, many }) => ({
  thread: one(chatThread, {
    fields: [chatMessage.threadId],
    references: [chatThread.id],
  }),
  sender: one(user, {
    fields: [chatMessage.senderId],
    references: [user.id],
  }),
  replyTo: one(chatMessage, {
    fields: [chatMessage.replyToId],
    references: [chatMessage.id],
    relationName: "chatMessageReplies",
  }),
  replies: many(chatMessage, { relationName: "chatMessageReplies" }),
  reactions: many(chatMessageReaction),
}));

export const chatMessageReactionRelations = relations(
  chatMessageReaction,
  ({ one }) => ({
    message: one(chatMessage, {
      fields: [chatMessageReaction.messageId],
      references: [chatMessage.id],
    }),
    user: one(user, {
      fields: [chatMessageReaction.userId],
      references: [user.id],
    }),
  }),
);
