import { pgEnum } from "drizzle-orm/pg-core";

// ─── Membership & Roles ─────────────────────────────────────────────────────
export const memberRoleEnum = pgEnum("member_role", [
  "adhyaksha",
  "koshadhyaksha",
  "sadasya",
]);

export const memberStatusEnum = pgEnum("member_status", [
  "active",
  "pending",
  "left",
  "removed",
]);

// ─── Payment ────────────────────────────────────────────────────────────────
export const paymentMethodTypeEnum = pgEnum("payment_method_type", [
  "bank",
  "wallet",
  "qr",
]);

// ─── Invites ────────────────────────────────────────────────────────────────
export const inviteTypeEnum = pgEnum("invite_type", [
  "targeted_email",
  "open_link",
]);

export const inviteStatusEnum = pgEnum("invite_status", [
  "active",
  "revoked",
  "expired",
]);

// ─── Join Requests ──────────────────────────────────────────────────────────
export const joinRequestStatusEnum = pgEnum("join_request_status", [
  "pending",
  "approved",
  "rejected",
]);

// ─── Contributions ──────────────────────────────────────────────────────────
export const contributionStatusEnum = pgEnum("contribution_status", [
  "pending",
  "paid",
  "partial",
  "late",
]);

// ─── Loans ──────────────────────────────────────────────────────────────────
export const loanStatusEnum = pgEnum("loan_status", [
  "active",
  "paid_off",
  "defaulted",
]);

// ─── Transactions & Approvals ───────────────────────────────────────────────
export const transactionTypeEnum = pgEnum("transaction_type", [
  "contribution",
  "loan_disbursement",
  "loan_repayment",
  "payout",
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending_approval",
  "approved",
  "rejected",
  "executed",
]);

export const approvalDecisionEnum = pgEnum("approval_decision", [
  "approved",
  "rejected",
]);

// ─── Kosh-End Payouts ───────────────────────────────────────────────────────
export const payoutStatusEnum = pgEnum("payout_status", [
  "pending",
  "approved",
  "paid",
]);

// ─── Chat ───────────────────────────────────────────────────────────────────
export const chatThreadTypeEnum = pgEnum("chat_thread_type", [
  "group",
  "direct",
]);

// ─── Push Tokens ────────────────────────────────────────────────────────────
export const platformEnum = pgEnum("platform", ["ios", "android"]);

// ─── Notifications ──────────────────────────────────────────────────────────
export const notificationTypeEnum = pgEnum("notification_type", [
  "invite",
  "contribution_due",
  "loan_due",
  "approval_needed",
  "transaction_approved",
  "transaction_rejected",
  "chat_message",
]);
