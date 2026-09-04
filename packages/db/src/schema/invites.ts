import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  integer,
  uuid,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { kosh } from "./kosh";
import { inviteStatusEnum, joinRequestStatusEnum } from "./enums";

// ─── Invites ────────────────────────────────────────────────────────────────
// One invite type — a code/link/QR are all just different presentations of the
// same underlying token. No email-targeted invites.
export const invite = pgTable(
  "invite",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    koshId: uuid("kosh_id")
      .notNull()
      .references(() => kosh.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    maxUses: integer("max_uses"),
    useCount: integer("use_count").notNull().default(0),
    expiresAt: timestamp("expires_at").notNull(),
    status: inviteStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("invite_kosh_id_idx").on(table.koshId),
  ],
);

// ─── Join Requests ──────────────────────────────────────────────────────────
// Every join goes through this table, regardless of invite channel.
export const joinRequest = pgTable(
  "join_request",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    inviteId: uuid("invite_id")
      .notNull()
      .references(() => invite.id, { onDelete: "cascade" }),
    koshId: uuid("kosh_id")
      .notNull()
      .references(() => kosh.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: joinRequestStatusEnum("status").notNull().default("pending"),
    requestedAt: timestamp("requested_at").defaultNow().notNull(),
    reviewedBy: text("reviewed_by").references(() => user.id),
    reviewedAt: timestamp("reviewed_at"),
    rejectionReason: text("rejection_reason"),
  },
  (table) => [
    index("join_request_kosh_id_idx").on(table.koshId),
    index("join_request_user_id_idx").on(table.userId),
  ],
);

// ─── Relations ──────────────────────────────────────────────────────────────

export const inviteRelations = relations(invite, ({ one, many }) => ({
  kosh: one(kosh, {
    fields: [invite.koshId],
    references: [kosh.id],
  }),
  creator: one(user, {
    fields: [invite.createdBy],
    references: [user.id],
  }),
  joinRequests: many(joinRequest),
}));

export const joinRequestRelations = relations(joinRequest, ({ one }) => ({
  invite: one(invite, {
    fields: [joinRequest.inviteId],
    references: [invite.id],
  }),
  kosh: one(kosh, {
    fields: [joinRequest.koshId],
    references: [kosh.id],
  }),
  user: one(user, {
    fields: [joinRequest.userId],
    references: [user.id],
  }),
  reviewer: one(user, {
    fields: [joinRequest.reviewedBy],
    references: [user.id],
  }),
}));
