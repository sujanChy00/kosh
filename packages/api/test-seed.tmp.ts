import { config } from "dotenv";
config({ path: "../../apps/server/.env", quiet: true });
const { db } = await import("@kosh-app/db");
const { sql } = await import("drizzle-orm");

const TEST_EMAIL = "tester2@kosh.local";
const TEST_ID = "test2user0000000000000000000000a";

// Idempotent: bail if already there.
const exists = await db.execute(sql`SELECT id FROM "user" WHERE id = ${TEST_ID}`);
if (exists.rows.length > 0) { console.log("already seeded"); process.exit(0); }

const kosh = await db.execute(sql`SELECT id, name FROM kosh LIMIT 1`);
const koshId = kosh.rows[0].id;
console.log("kosh:", kosh.rows[0].name, koshId);

await db.execute(sql`
  INSERT INTO "user" (id, name, email, email_verified, image, biometric_enabled, preferred_lang, created_at, updated_at)
  VALUES (${TEST_ID}, 'Test Two', ${TEST_EMAIL}, true, null, false, 'en', now(), now())
`);
await db.execute(sql`
  INSERT INTO kosh_membership (kosh_id, user_id, role, status, joined_at)
  VALUES (${koshId}, ${TEST_ID}, 'sadasya', 'active', now())
`);

const mem = await db.execute(sql`SELECT u.name, m.role, m.status FROM kosh_membership m JOIN "user" u ON u.id = m.user_id ORDER BY u.name`);
console.log("members:");
for (const r of mem.rows) console.log("  -", r.name, `(${r.role}, ${r.status})`);
process.exit(0);
