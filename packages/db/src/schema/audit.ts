import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { kosh } from "./kosh";

// ─── Audit Logs ─────────────────────────────────────────────────────────────
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    koshId: uuid("kosh_id").references(() => kosh.id, { onDelete: "cascade" }),
    actorId: text("actor_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    action: text("action").notNull(), // e.g. "updated_interest_rate", "changed_role"
    oldValue: jsonb("old_value"),
    newValue: jsonb("new_value"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("audit_log_kosh_id_idx").on(table.koshId),
    index("audit_log_actor_id_idx").on(table.actorId),
    index("audit_log_created_at_idx").on(table.createdAt),
  ],
);

// ─── Relations ──────────────────────────────────────────────────────────────

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  kosh: one(kosh, {
    fields: [auditLog.koshId],
    references: [kosh.id],
  }),
  actor: one(user, {
    fields: [auditLog.actorId],
    references: [user.id],
  }),
}));
