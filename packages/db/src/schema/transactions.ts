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
import {
  transactionTypeEnum,
  transactionStatusEnum,
  approvalDecisionEnum,
} from "./enums";

// ─── Transactions (approval wrapper) ────────────────────────────────────────
export const transaction = pgTable(
  "transaction",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    koshId: uuid("kosh_id")
      .notNull()
      .references(() => kosh.id, { onDelete: "cascade" }),
    type: transactionTypeEnum("type").notNull(),
    referenceId: uuid("reference_id").notNull(), // points to contribution/loan/repayment/payout
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    initiatedBy: text("initiated_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    status: transactionStatusEnum("status").notNull().default("pending_approval"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    executedAt: timestamp("executed_at"),
  },
  (table) => [
    index("transaction_kosh_id_idx").on(table.koshId),
    index("transaction_status_idx").on(table.status),
    index("transaction_initiated_by_idx").on(table.initiatedBy),
  ],
);

// ─── Transaction Approvals ──────────────────────────────────────────────────
export const transactionApproval = pgTable(
  "transaction_approval",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    transactionId: uuid("transaction_id")
      .notNull()
      .references(() => transaction.id, { onDelete: "cascade" }),
    treasurerId: text("treasurer_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    decision: approvalDecisionEnum("decision").notNull(),
    reason: text("reason"), // required when decision = rejected
    decidedAt: timestamp("decided_at").defaultNow().notNull(),
  },
  (table) => [
    index("transaction_approval_transaction_id_idx").on(table.transactionId),
    index("transaction_approval_treasurer_id_idx").on(table.treasurerId),
  ],
);

// ─── Relations ──────────────────────────────────────────────────────────────

export const transactionRelations = relations(transaction, ({ one, many }) => ({
  kosh: one(kosh, {
    fields: [transaction.koshId],
    references: [kosh.id],
  }),
  initiator: one(user, {
    fields: [transaction.initiatedBy],
    references: [user.id],
  }),
  approvals: many(transactionApproval),
}));

export const transactionApprovalRelations = relations(
  transactionApproval,
  ({ one }) => ({
    transaction: one(transaction, {
      fields: [transactionApproval.transactionId],
      references: [transaction.id],
    }),
    treasurer: one(user, {
      fields: [transactionApproval.treasurerId],
      references: [user.id],
    }),
  }),
);
