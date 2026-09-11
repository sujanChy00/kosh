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
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { memberRoleEnum, memberStatusEnum } from "./enums";

// ─── Kosh ───────────────────────────────────────────────────────────────────
export const kosh = pgTable("kosh", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionPin: text("transaction_pin").notNull(), // 6-digit PIN, set/changed only by the kosh's admin (creator)
  name: text("name").notNull(),
  description: text("description"),
  iconUrl: text("icon_url"),
  monthlyAmount: decimal("monthly_amount", { precision: 12, scale: 2 }).notNull(),
  dueDay: integer("due_day").notNull(), // day of month (1-28)
  currency: text("currency").notNull().default("NPR"),
  memberInterestRate: decimal("member_interest_rate", { precision: 5, scale: 2 }).notNull(),
  nonMemberInterestRate: decimal("non_member_interest_rate", { precision: 5, scale: 2 }).notNull(),
  loanCap: decimal("loan_cap", { precision: 12, scale: 2 }).notNull(),
  latePenaltyAmount: decimal("late_penalty_amount", { precision: 12, scale: 2 }),
  startDate: date("start_date").notNull(),
  durationMonths: integer("duration_months").notNull(),
  endDate: date("end_date").notNull(), // computed from start_date + duration_months
  minTreasurers: integer("min_treasurers").notNull().default(0),
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

// ─── Relations ──────────────────────────────────────────────────────────────

export const koshRelations = relations(kosh, ({ one, many }) => ({
  creator: one(user, {
    fields: [kosh.createdBy],
    references: [user.id],
  }),
  memberships: many(koshMembership),
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
