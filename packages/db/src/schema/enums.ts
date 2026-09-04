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
export const loanRequestOriginEnum = pgEnum("loan_request_origin", [
  "member_requested",
  "admin_initiated",
]);

export const loanRequestStatusEnum = pgEnum("loan_request_status", [
  "pending_adhyaksha",
  "pending_koshadhyaksha",
  "approved",
  "rejected",
]);

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

export const chatMessageTypeEnum = pgEnum("chat_message_type", [
  "text",
  "image",
  "file",
  "system",
]);


// ─── Push Tokens ────────────────────────────────────────────────────────────
export const platformEnum = pgEnum("platform", ["ios", "android"]);

// ─── Notifications ──────────────────────────────────────────────────────────
export const notificationTypeEnum = pgEnum("notification_type", [
  "join_request_submitted",
  "join_request_approved",
  "join_request_rejected",
  "role_changed",
  "contribution_due",
  "contribution_late",
  "loan_requested",
  "loan_request_approved",
  "loan_request_rejected",
  "loan_repayment_due",
  "loan_repayment_overdue",
  "transaction_pending_approval",
  "transaction_approved",
  "transaction_rejected",
  "chat_message",
  "kosh_ending_soon",
  "kosh_end_payout_processed",
  "member_removed",
  "security_alert",
]);

