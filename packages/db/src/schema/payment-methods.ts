import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { paymentMethodTypeEnum } from "./enums";

// ─── Payment Methods ────────────────────────────────────────────────────────
export const paymentMethod = pgTable("payment_method", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: paymentMethodTypeEnum("type").notNull(),
  label: text("label"), // e.g. "eSewa", "NIC Asia"
  accountDetails: jsonb("account_details").notNull(), // flexible per type
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Relations ──────────────────────────────────────────────────────────────

export const paymentMethodRelations = relations(paymentMethod, ({ one }) => ({
  user: one(user, {
    fields: [paymentMethod.userId],
    references: [user.id],
  }),
}));
