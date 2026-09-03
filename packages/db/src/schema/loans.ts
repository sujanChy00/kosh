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
import { paymentMethod } from "./payment-methods";
import { loanStatusEnum } from "./enums";

// ─── Non-Member Borrowers ───────────────────────────────────────────────────
export const nonMemberBorrower = pgTable("non_member_borrower", {
  id: uuid("id").primaryKey().defaultRandom(),
  koshId: uuid("kosh_id")
    .notNull()
    .references(() => kosh.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone"),
  notes: text("notes"),
});

// ─── Loans ──────────────────────────────────────────────────────────────────
export const loan = pgTable(
  "loan",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    koshId: uuid("kosh_id")
      .notNull()
      .references(() => kosh.id, { onDelete: "cascade" }),
    borrowerId: text("borrower_id").references(() => user.id, {
      onDelete: "set null",
    }), // null if non-member borrower
    nonMemberBorrowerId: uuid("non_member_borrower_id").references(
      () => nonMemberBorrower.id,
      { onDelete: "set null" },
    ),
    principal: decimal("principal", { precision: 12, scale: 2 }).notNull(),
    interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).notNull(),
    issueDate: date("issue_date").notNull(),
    dueDate: date("due_date"),
    status: loanStatusEnum("status").notNull().default("active"),
    amountRemaining: decimal("amount_remaining", { precision: 12, scale: 2 }).notNull(),
    payoutMethodId: uuid("payout_method_id").references(() => paymentMethod.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("loan_kosh_id_idx").on(table.koshId),
    index("loan_borrower_id_idx").on(table.borrowerId),
  ],
);

// ─── Loan Repayments ────────────────────────────────────────────────────────
export const loanRepayment = pgTable(
  "loan_repayment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    loanId: uuid("loan_id")
      .notNull()
      .references(() => loan.id, { onDelete: "cascade" }),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    date: timestamp("date").defaultNow().notNull(),
    remainingBalanceAfter: decimal("remaining_balance_after", {
      precision: 12,
      scale: 2,
    }).notNull(),
    recordedBy: text("recorded_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
  },
  (table) => [index("loan_repayment_loan_id_idx").on(table.loanId)],
);

// ─── Relations ──────────────────────────────────────────────────────────────

export const nonMemberBorrowerRelations = relations(
  nonMemberBorrower,
  ({ one, many }) => ({
    kosh: one(kosh, {
      fields: [nonMemberBorrower.koshId],
      references: [kosh.id],
    }),
    loans: many(loan),
  }),
);

export const loanRelations = relations(loan, ({ one, many }) => ({
  kosh: one(kosh, {
    fields: [loan.koshId],
    references: [kosh.id],
  }),
  borrower: one(user, {
    fields: [loan.borrowerId],
    references: [user.id],
  }),
  nonMemberBorrower: one(nonMemberBorrower, {
    fields: [loan.nonMemberBorrowerId],
    references: [nonMemberBorrower.id],
  }),
  payoutMethod: one(paymentMethod, {
    fields: [loan.payoutMethodId],
    references: [paymentMethod.id],
  }),
  repayments: many(loanRepayment),
}));

export const loanRepaymentRelations = relations(loanRepayment, ({ one }) => ({
  loan: one(loan, {
    fields: [loanRepayment.loanId],
    references: [loan.id],
  }),
  recorder: one(user, {
    fields: [loanRepayment.recordedBy],
    references: [user.id],
  }),
}));
