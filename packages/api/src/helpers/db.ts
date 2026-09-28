import { db } from "@kosh-app/db";

/**
 * The transaction handle drizzle hands to `db.transaction(async (tx) => ...)`,
 * resolved from `db` itself so it can never drift from the real client.
 */
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Either the root client or an in-flight transaction. */
export type DbOrTx = typeof db | Tx;
