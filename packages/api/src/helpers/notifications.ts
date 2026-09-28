import { notification } from "@kosh-app/db/schema/notifications";

import type { DbOrTx } from "./db";

type NotificationInsert = typeof notification.$inferInsert;

export type CreateNotificationInput = Omit<
  NotificationInsert,
  "userId"
> & { userId: string };

/**
 * Insert notifications for one or more recipients in a single query. Passing
 * the whole recipient list at once matters: kosh size is in the dozens, and
 * looping row-by-row is both slower and easier to half-fail.
 */
export async function createNotifications(
  client: DbOrTx,
  rows: CreateNotificationInput[],
) {
  if (rows.length === 0) return [];
  return client.insert(notification).values(rows).returning();
}
