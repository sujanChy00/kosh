import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  decimal,
  uuid,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { kosh } from "./kosh";
import { paymentMethod } from "./payment-methods";
import { payoutStatusEnum } from "./enums";

// ─── Kosh-End Payouts ───────────────────────────────────────────────────────
export const koshEndPayout = pgTable(
  "kosh_end_payout",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    koshId: uuid("kosh_id")
      .notNull()
      .references(() => kosh.id, { onDelete: "cascade" }),
    memberId: text("member_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    grossShare: decimal("gross_share", { precision: 12, scale: 2 }).notNull(),
    loanDeduction: decimal("loan_deduction", { precision: 12, scale: 2 }).notNull(),
    netPayout: decimal("net_payout", { precision: 12, scale: 2 }).notNull(),
    payoutMethodId: uuid("payout_method_id").references(() => paymentMethod.id, {
      onDelete: "set null",
    }),
    status: payoutStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("kosh_end_payout_kosh_id_idx").on(table.koshId),
    index("kosh_end_payout_member_id_idx").on(table.memberId),
  ],
);

// ─── Relations ──────────────────────────────────────────────────────────────

export const koshEndPayoutRelations = relations(koshEndPayout, ({ one }) => ({
  kosh: one(kosh, {
    fields: [koshEndPayout.koshId],
    references: [kosh.id],
  }),
  member: one(user, {
    fields: [koshEndPayout.memberId],
    references: [user.id],
  }),
  payoutMethod: one(paymentMethod, {
    fields: [koshEndPayout.payoutMethodId],
    references: [paymentMethod.id],
  }),
}));
