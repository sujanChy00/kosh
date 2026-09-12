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
import {
  loanRequestOriginEnum,
  loanRequestStatusEnum,
  loanStatusEnum,
} from "./enums";

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

// ─── Loan Requests ──────────────────────────────────────────────────────────
// Covers both origin paths — member-requested in-app, or Adhyaksh entering
// a loan requested outside the app; both converge on the same approval flow
// and broadcast notifications to all kosh members.
export const loanRequest = pgTable(
  "loan_request",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    koshId: uuid("kosh_id")
      .notNull()
      .references(() => kosh.id, { onDelete: "cascade" }),
    origin: loanRequestOriginEnum("origin").notNull(),
    // The borrower — themselves if member_requested, or selected by Adhyaksh
    // if admin_initiated.
    requestedBy: text("requested_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Who actually submitted the record (equals requestedBy for
    // member_requested; the Adhyaksh for admin_initiated).
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    amountRequested: decimal("amount_requested", { precision: 12, scale: 2 }).notNull(),
    note: text("note"),
    // pending_adhyaksh only applies to member_requested; admin_initiated
    // skips straight to pending_koshadhyaksh since Adhyaksh creating it
    // counts as their approval.
    status: loanRequestStatusEnum("status").notNull().default("pending_adhyaksh"),
    rejectionReason: text("rejection_reason"),
    // Set once it clears approval and becomes an actual loan.
    resultingLoanId: uuid("resulting_loan_id"),
    // The Koshadhyaksh-approval wrapper transaction.
    resultingTransactionId: uuid("resulting_transaction_id"),
    adhyakshDecidedBy: text("adhyaksh_decided_by").references(() => user.id),
    adhyakshDecidedAt: timestamp("adhyaksh_decided_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("loan_request_kosh_id_idx").on(table.koshId),
    index("loan_request_status_idx").on(table.status),
    index("loan_request_requested_by_idx").on(table.requestedBy),
  ],
);

// ─── Loans ──────────────────────────────────────────────────────────────────
export const loan = pgTable(
  "loan",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    koshId: uuid("kosh_id")
      .notNull()
      .references(() => kosh.id, { onDelete: "cascade" }),
    // null if Adhyaksh issued directly without a prior request
    loanRequestId: uuid("loan_request_id").references(() => loanRequest.id, {
      onDelete: "set null",
    }),
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

export const loanRequestRelations = relations(loanRequest, ({ one }) => ({
  kosh: one(kosh, {
    fields: [loanRequest.koshId],
    references: [kosh.id],
  }),
  requester: one(user, {
    fields: [loanRequest.requestedBy],
    references: [user.id],
    relationName: "loanRequestRequester",
  }),
  creator: one(user, {
    fields: [loanRequest.createdBy],
    references: [user.id],
    relationName: "loanRequestCreator",
  }),
  adhyakshDecider: one(user, {
    fields: [loanRequest.adhyakshDecidedBy],
    references: [user.id],
    relationName: "loanRequestAdhyakshDecider",
  }),
  resultingLoan: one(loan, {
    fields: [loanRequest.resultingLoanId],
    references: [loan.id],
  }),
}));

export const loanRelations = relations(loan, ({ one, many }) => ({
  kosh: one(kosh, {
    fields: [loan.koshId],
    references: [kosh.id],
  }),
  loanRequest: one(loanRequest, {
    fields: [loan.loanRequestId],
    references: [loanRequest.id],
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
