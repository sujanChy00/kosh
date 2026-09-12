import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  integer,
  decimal,
  date,
  uuid,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import {
  memberRoleEnum,
  memberStatusEnum,
  treasurerInviteStatusEnum,
} from "./enums";

// ─── Kosh ───────────────────────────────────────────────────────────────────
export const kosh = pgTable("kosh", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(), // stable invitation/reference code, e.g. `SAGA-7XPK`
  transactionPin: text("transaction_pin").notNull(), // 6-digit PIN, set/changed only by the kosh's admin (creator)
  name: text("name").notNull(),
  description: text("description"),
  iconUrl: text("icon_url"),
  monthlyAmount: decimal("monthly_amount", { precision: 12, scale: 2 }).notNull(),
  dueDay: integer("due_day").notNull(), // day of month (1-28)
  currency: text("currency").notNull().default("NPR"), // fixed to NPR (Nepali Rupees)
  memberInterestRate: decimal("member_interest_rate", { precision: 5, scale: 2 }).notNull(),
  nonMemberInterestRate: decimal("non_member_interest_rate", { precision: 5, scale: 2 }).notNull(),
  loanCap: decimal("loan_cap", { precision: 12, scale: 2 }).notNull(),
  latePenaltyAmount: decimal("late_penalty_amount", { precision: 12, scale: 2 }),
  startDate: date("start_date").notNull(),
  durationMonths: integer("duration_months").notNull(),
  endDate: date("end_date").notNull(), // computed from start_date + duration_months
  maxMembers: integer("max_members"),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// ─── Kosh Memberships ───────────────────────────────────────────────────────
export const koshMembership = pgTable(
  "kosh_membership",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    koshId: uuid("kosh_id")
      .notNull()
      .references(() => kosh.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").notNull().default("sadasya"),
    status: memberStatusEnum("status").notNull().default("active"),
    joinedAt: timestamp("joined_at"),
    leftAt: timestamp("left_at"),
  },
  (table) => [
    uniqueIndex("kosh_membership_kosh_user_uidx").on(table.koshId, table.userId),
  ],
);

// ─── Treasurer (Koshadhyaksh) Invitations ───────────────────────────────────
// The admin invites an existing member to become a Koshadhyaksh. The member
// accepts (becomes treasurer) or rejects (optional reason), and the admin is
// notified of the outcome.
export const koshRoleRequest = pgTable(
  "kosh_role_request",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    koshId: uuid("kosh_id")
      .notNull()
      .references(() => kosh.id, { onDelete: "cascade" }),
    invitedBy: text("invited_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    inviteeId: text("invitee_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    targetRole: memberRoleEnum("target_role").notNull().default("koshadhyaksh"),
    status: treasurerInviteStatusEnum("status").notNull().default("pending"),
    reason: text("reason"), // optional reason if the invitation is rejected
    decidedAt: timestamp("decided_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("kosh_role_request_kosh_idx").on(table.koshId),
    index("kosh_role_request_invitee_idx").on(table.inviteeId),
  ],
);

// ─── Relations ──────────────────────────────────────────────────────────────

export const koshRelations = relations(kosh, ({ one, many }) => ({
  creator: one(user, {
    fields: [kosh.createdBy],
    references: [user.id],
  }),
  memberships: many(koshMembership),
  roleRequests: many(koshRoleRequest),
}));

export const koshMembershipRelations = relations(koshMembership, ({ one }) => ({
  kosh: one(kosh, {
    fields: [koshMembership.koshId],
    references: [kosh.id],
  }),
  user: one(user, {
    fields: [koshMembership.userId],
    references: [user.id],
  }),
}));

export const koshRoleRequestRelations = relations(koshRoleRequest, ({ one }) => ({
  kosh: one(kosh, {
    fields: [koshRoleRequest.koshId],
    references: [kosh.id],
  }),
  inviter: one(user, {
    fields: [koshRoleRequest.invitedBy],
    references: [user.id],
  }),
  invitee: one(user, {
    fields: [koshRoleRequest.inviteeId],
    references: [user.id],
  }),
}));
