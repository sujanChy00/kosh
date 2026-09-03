import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  decimal,
  date,
  uuid,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { kosh } from "./kosh";
import { contributionStatusEnum } from "./enums";

// ─── Contributions ──────────────────────────────────────────────────────────
export const contribution = pgTable(
  "contribution",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    koshId: uuid("kosh_id")
      .notNull()
      .references(() => kosh.id, { onDelete: "cascade" }),
    memberId: text("member_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    period: date("period").notNull(), // represents the contribution month
    expectedAmount: decimal("expected_amount", { precision: 12, scale: 2 }).notNull(),
    paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    status: contributionStatusEnum("status").notNull().default("pending"),
    penaltyAmount: decimal("penalty_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    datePaid: timestamp("date_paid"),
    recordedBy: text("recorded_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("contribution_kosh_id_idx").on(table.koshId),
    index("contribution_member_id_idx").on(table.memberId),
    index("contribution_period_idx").on(table.koshId, table.period),
  ],
);

// ─── Relations ──────────────────────────────────────────────────────────────

export const contributionRelations = relations(contribution, ({ one }) => ({
  kosh: one(kosh, {
    fields: [contribution.koshId],
    references: [kosh.id],
  }),
  member: one(user, {
    fields: [contribution.memberId],
    references: [user.id],
  }),
  recorder: one(user, {
    fields: [contribution.recordedBy],
    references: [user.id],
  }),
}));
