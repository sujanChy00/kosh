import { db } from "@kosh-app/db";
import { invite, joinRequest } from "@kosh-app/db/schema/invites";
import { koshMembership } from "@kosh-app/db/schema/kosh";
import { notification } from "@kosh-app/db/schema/notifications";
import { TRPCError } from "@trpc/server";
import { and, eq, lt, sql } from "drizzle-orm";
import { randomInt } from "node:crypto";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

const koshIdSchema = z.string().uuid();
const tokenSchema = z.string().trim().toUpperCase().min(1).max(20);

// Ambiguity-free alphabet for shareable invite codes (no 0/O, 1/I, L).
const TOKEN_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateCode(length: number) {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += TOKEN_ALPHABET[randomInt(TOKEN_ALPHABET.length)];
  }
  return out;
}

// Prefix derives from the kosh name (e.g. "Sagar" -> "SAGA"), fallback "KOSH".
function invitePrefix(name: string) {
  const letters = name
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 4);
  if (letters.length < 3) return "KOSH";
  return letters.padEnd(4, "X");
}

async function getActiveMembership(koshId: string, userId: string) {
  return db.query.koshMembership.findFirst({
    where: (m, { and: a, eq: q }) =>
      a(q(m.koshId, koshId), q(m.userId, userId), q(m.status, "active")),
  });
}

async function countActiveMembers(koshId: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(koshMembership)
    .where(
      and(
        eq(koshMembership.koshId, koshId),
        eq(koshMembership.status, "active"),
      ),
    );
  return row?.count ?? 0;
}

type InviteLookup =
  | { row: null; status: "not_found" }
  | { row: NonNullable<Awaited<ReturnType<typeof db.query.invite.findFirst>>>; status: "active" | "expired" | "revoked" };

async function lookUpInvite(token: string): Promise<InviteLookup> {
  const row = await db.query.invite.findFirst({
    where: (i, { eq: q }) => q(i.token, token),
  });
  if (!row) return { row: null, status: "not_found" };
  if (row.status === "revoked") return { row, status: "revoked" };
  if (row.expiresAt.getTime() <= Date.now()) {
    await db
      .update(invite)
      .set({ status: "expired" })
      .where(eq(invite.id, row.id));
    return { row, status: "expired" };
  }
  return { row, status: "active" };
}

async function assertAdhyaksh(koshId: string, userId: string) {
  const membership = await getActiveMembership(koshId, userId);
  if (!membership || membership.role !== "adhyaksh") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only the Adhyaksh can do this",
    });
  }
}

async function assertManager(koshId: string, userId: string) {
  const membership = await getActiveMembership(koshId, userId);
  if (
    !membership ||
    (membership.role !== "adhyaksh" && membership.role !== "koshadhyaksh")
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only the Adhyaksh or Koshadhyaksh can do this",
    });
  }
}

async function getKoshName(koshId: string) {
  const row = await db.query.kosh.findFirst({
    where: (k, { eq: q }) => q(k.id, koshId),
    columns: { id: true, name: true, maxMembers: true },
  });
  return row;
}

export const inviteRouter = router({
  /** Adhyaksh generates a shareable invite (code / link / QR). Always expires. */
  create: protectedProcedure
    .input(
      z.object({
        koshId: koshIdSchema,
        maxUses: z.number().int().min(1).max(10_000).default(50),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const koshRow = await db.query.kosh.findFirst({
        where: (k, { eq: q }) => q(k.id, input.koshId),
        columns: { id: true, name: true },
      });
      if (!koshRow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Kosh not found" });
      }
      await assertAdhyaksh(input.koshId, ctx.session.user.id);

      const prefix = invitePrefix(koshRow.name);
      for (let attempt = 0; attempt < 5; attempt++) {
        const token = `${prefix}-${generateCode(4)}`;
        try {
          const [row] = await db
            .insert(invite)
            .values({
              koshId: input.koshId,
              token,
              createdBy: ctx.session.user.id,
              maxUses: input.maxUses,
            })
            .returning();
          if (!row) throw new Error("Invite insert returned no row");
          return row;
        } catch (error) {
          const isCollision =
            error instanceof Error &&
            error.message.includes(
              "duplicate key value violates unique constraint",
            );
          if (!isCollision) throw error;
        }
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate a unique invite code",
      });
    }),

  /** Invites for a kosh — Adhyaksh/Koshadhyaksh only. */
  list: protectedProcedure
    .input(z.object({ koshId: koshIdSchema }))
    .query(async ({ ctx, input }) => {
      await assertManager(input.koshId, ctx.session.user.id);

      await db
        .update(invite)
        .set({ status: "expired" })
        .where(
          and(
            eq(invite.koshId, input.koshId),
            eq(invite.status, "active"),
            lt(invite.expiresAt, new Date()),
          ),
        );

      return db.query.invite.findMany({
        where: (i, { eq: q }) => q(i.koshId, input.koshId),
        orderBy: (i, { desc }) => [desc(i.createdAt)],
      });
    }),

  /** Adhyaksh revokes an invite — the token stops working immediately. */
  revoke: protectedProcedure
    .input(z.object({ inviteId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const row = await db.query.invite.findFirst({
        where: (i, { eq: q }) => q(i.id, input.inviteId),
        columns: { id: true, koshId: true },
      });
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found" });
      }
      await assertAdhyaksh(row.koshId, ctx.session.user.id);

      const [updated] = await db
        .update(invite)
        .set({ status: "revoked" })
        .where(eq(invite.id, input.inviteId))
        .returning();
      if (!updated) throw new Error("Failed to revoke invite");
      return updated;
    }),

  /**
   * Any logged-in user resolves a code/link/QR to the kosh's details and the
   * invite's validity — powers the "Invite expired/revoked" UX.
   */
  preview: protectedProcedure
    .input(z.object({ token: tokenSchema }))
    .query(async ({ ctx, input }) => {
      const lookup = await lookUpInvite(input.token);
      const base = {
        inviteStatus: lookup.status,
        expiresAt: lookup.row?.expiresAt ?? null,
        maxUses: lookup.row?.maxUses ?? null,
        useCount: lookup.row?.useCount ?? 0,
      };
      if (!lookup.row) return { kosh: null, yourMembership: "none", ...base };

      const koshRow = await db.query.kosh.findFirst({
        where: (k, { eq: q }) => q(k.id, lookup.row.koshId),
        columns: {
          id: true,
          name: true,
          description: true,
          iconUrl: true,
          monthlyAmount: true,
          maxMembers: true,
        },
      });
      if (!koshRow) return { kosh: null, yourMembership: "none", ...base };

      const membership = await db.query.koshMembership.findFirst({
        where: (m, { and: a, eq: q }) =>
          a(q(m.koshId, koshRow.id), q(m.userId, ctx.session.user.id)),
        columns: { status: true },
      });

      return {
        kosh: {
          id: koshRow.id,
          name: koshRow.name,
          description: koshRow.description,
          iconUrl: koshRow.iconUrl,
          monthlyAmount: koshRow.monthlyAmount,
          maxMembers: koshRow.maxMembers,
          memberCount: await countActiveMembers(koshRow.id),
        },
        yourMembership: membership?.status ?? "none",
        ...base,
      };
    }),

  /** User redeems a token => pending join request, notifies the Adhyaksh(s). */
  requestJoin: protectedProcedure
    .input(z.object({ token: tokenSchema }))
    .mutation(async ({ ctx, input }) => {
      const lookup = await lookUpInvite(input.token);
      if (!lookup.row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found" });
      }
      if (lookup.status !== "active") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            lookup.status === "expired"
              ? "This invite has expired"
              : "This invite has been revoked",
        });
      }
      const koshRow = await db.query.kosh.findFirst({
        where: (k, { eq: q }) => q(k.id, lookup.row.koshId),
        columns: { id: true, name: true, maxMembers: true },
      });
      if (!koshRow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Kosh not found" });
      }
      const inviteRow = lookup.row;

      return db.transaction(async (tx) => {
        const existing = await tx.query.koshMembership.findFirst({
          where: (m, { and: a, eq: q }) =>
            a(
              q(m.koshId, inviteRow.koshId),
              q(m.userId, ctx.session.user.id),
            ),
          columns: { id: true, status: true },
        });
        if (existing?.status === "active") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "You are already a member of this kosh",
          });
        }
        if (existing?.status === "pending") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "You already have a pending request to join this kosh",
          });
        }
        if (
          inviteRow.maxUses != null &&
          inviteRow.useCount >= inviteRow.maxUses
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This invite has reached its usage limit",
          });
        }
        if (koshRow.maxMembers != null) {
          const [countRow] = await tx
            .select({ count: sql<number>`count(*)::int` })
            .from(koshMembership)
            .where(
              and(
                eq(koshMembership.koshId, koshRow.id),
                eq(koshMembership.status, "active"),
              ),
            );
          if ((countRow?.count ?? 0) >= koshRow.maxMembers) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "This kosh has reached its member limit",
            });
          }
        }

        // Reactivate a left/removed membership as pending, else create one.
        if (existing) {
          await tx
            .update(koshMembership)
            .set({ status: "pending", joinedAt: null, leftAt: null })
            .where(eq(koshMembership.id, existing.id));
        } else {
          await tx.insert(koshMembership).values({
            koshId: koshRow.id,
            userId: ctx.session.user.id,
            role: "sadasya",
            status: "pending",
          });
        }

        const [request] = await tx
          .insert(joinRequest)
          .values({
            inviteId: inviteRow.id,
            koshId: koshRow.id,
            userId: ctx.session.user.id,
            status: "pending",
          })
          .returning();
        if (!request) throw new Error("Join request insert returned no row");

        await tx
          .update(invite)
          .set({ useCount: sql`${invite.useCount} + 1` })
          .where(eq(invite.id, inviteRow.id));

        const adhyakshs = await tx.query.koshMembership.findMany({
          where: (m, { and: a, eq: q }) =>
            a(
              q(m.koshId, koshRow.id),
              q(m.role, "adhyaksh"),
              q(m.status, "active"),
            ),
          columns: { userId: true },
        });
        if (adhyakshs.length > 0) {
          await tx.insert(notification).values(
            adhyakshs.map((a) => ({
              userId: a.userId,
              koshId: koshRow.id,
              type: "join_request_submitted" as const,
              requiresAction: true,
              title: "New join request",
              body: `${ctx.session.user.name} wants to join ${koshRow.name}`,
              data: {
                koshId: koshRow.id,
                requestId: request.id,
                screen: "join-requests",
              },
            })),
          );
        }

        return request;
      });
    }),

  /** Join requests for a kosh — Adhyaksh/Koshadhyaksh only. */
  requests: protectedProcedure
    .input(z.object({ koshId: koshIdSchema }))
    .query(async ({ ctx, input }) => {
      await assertManager(input.koshId, ctx.session.user.id);

      return db.query.joinRequest.findMany({
        where: (r, { eq: q }) => q(r.koshId, input.koshId),
        with: {
          user: {
            columns: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: (r, { desc }) => [desc(r.requestedAt)],
      });
    }),

  /** Adhyaksh approves/rejects a join request. */
  review: protectedProcedure
    .input(
      z.object({
        requestId: z.string().uuid(),
        decision: z.enum(["approved", "rejected"]),
        reason: z.string().trim().max(300).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const request = await db.query.joinRequest.findFirst({
        where: (r, { eq: q }) => q(r.id, input.requestId),
      });
      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Join request not found",
        });
      }
      if (request.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This request has already been reviewed",
        });
      }
      await assertAdhyaksh(request.koshId, ctx.session.user.id);

      const koshRow = await getKoshName(request.koshId);

      const result = await db.transaction(async (tx) => {
        if (input.decision === "approved") {
          if (koshRow?.maxMembers != null) {
            const [countRow] = await tx
              .select({ count: sql<number>`count(*)::int` })
              .from(koshMembership)
              .where(
                and(
                  eq(koshMembership.koshId, request.koshId),
                  eq(koshMembership.status, "active"),
                ),
              );
            if ((countRow?.count ?? 0) >= koshRow.maxMembers) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "This kosh has reached its member limit",
              });
            }
          }

          const membership = await tx.query.koshMembership.findFirst({
            where: (m, { and: a, eq: q }) =>
              a(
                q(m.koshId, request.koshId),
                q(m.userId, request.userId),
              ),
            columns: { id: true, status: true },
          });
          if (!membership || membership.status !== "pending") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "This user has no pending membership for this kosh",
            });
          }
          await tx
            .update(koshMembership)
            .set({
              status: "active",
              role: "sadasya",
              joinedAt: new Date(),
              leftAt: null,
            })
            .where(eq(koshMembership.id, membership.id));

          const [updated] = await tx
            .update(joinRequest)
            .set({
              status: "approved",
              reviewedBy: ctx.session.user.id,
              reviewedAt: new Date(),
            })
            .where(eq(joinRequest.id, input.requestId))
            .returning();
          if (!updated) throw new Error("Failed to approve join request");
          return updated;
        }

        const [updated] = await tx
          .update(joinRequest)
          .set({
            status: "rejected",
            reviewedBy: ctx.session.user.id,
            reviewedAt: new Date(),
            rejectionReason: input.reason?.trim()
              ? input.reason.trim()
              : null,
          })
          .where(eq(joinRequest.id, input.requestId))
          .returning();
        if (!updated) throw new Error("Failed to reject join request");

        // Delete the pending membership so the (kosh, user) slot is free again.
        await tx
          .delete(koshMembership)
          .where(
            and(
              eq(koshMembership.koshId, request.koshId),
              eq(koshMembership.userId, request.userId),
              eq(koshMembership.status, "pending"),
            ),
          );

        return updated;
      });

      await db.insert(notification).values({
        userId: request.userId,
        koshId: request.koshId,
        type:
          result.status === "approved"
            ? "join_request_approved"
            : "join_request_rejected",
        requiresAction: false,
        title:
          result.status === "approved"
            ? "Join request approved"
            : "Join request declined",
        body:
          result.status === "approved"
            ? `Your request to join ${koshRow?.name ?? "the kosh"} was approved`
            : `Your request to join ${koshRow?.name ?? "the kosh"} was declined${
                result.rejectionReason?.trim()
                  ? ` Reason: ${result.rejectionReason.trim()}`
                  : ""
              }`,
        data: {
          koshId: request.koshId,
          screen: result.status === "approved" ? "kosh" : "kosh-list",
        },
      });

      return result;
    }),
});