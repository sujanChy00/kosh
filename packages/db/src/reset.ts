import { config } from "dotenv";
import { resolve } from "node:path";
import { Pool } from "pg";

config({ path: resolve(__dirname, "../../../apps/server/.env") });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

await pool.query(`
  DROP SCHEMA public CASCADE;
  CREATE SCHEMA public;
  DROP SCHEMA IF EXISTS drizzle CASCADE;
`);
await pool.end();

console.log("Schemas reset");
