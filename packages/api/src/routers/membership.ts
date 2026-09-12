import { db } from "@kosh-app/db";
import {
  koshMembership,
  koshRoleRequest,
} from "@kosh-app/db/schema/kosh";
import { notification } from "@kosh-app/db/schema/notifications";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

const koshIdSchema = z.string().uuid();

async function getActiveMembership(koshId: string, userId: string) {
  return db.query.koshMembership.findFirst({
    where: (m, { and: a, eq: q }) =>
      a(q(m.koshId, koshId), q(m.userId, userId), q(m.status, "active")),
  });
}

async function getKosh(koshId: string) {
  return db.query.kosh.findFirst({
    where: (k, { eq: q }) => q(k.id, koshId),
    columns: { id: true, name: true },
  });
}

export const membershipRouter = router({
  /** Active members of a kosh (requires being an active member yourself). */
  list: protectedProcedure
    .input(z.object({ koshId: koshIdSchema }))
    .query(async ({ ctx, input }) => {
      const membership = await getActiveMembership(
        input.koshId,
        ctx.session.user.id,
      );
      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this kosh",
        });
      }

      const members = await db.query.koshMembership.findMany({
        where: (m, { and: a, eq: q }) =>
          a(q(m.koshId, input.koshId), q(m.status, "active")),
        with: {
          user: { columns: { id: true, name: true, email: true, image: true } },
        },
        columns: { userId: true, role: true, joinedAt: true },
      });

      return members.map((member) => ({
        userId: member.userId,
        role: member.role,
        joinedAt: member.joinedAt,
        name: member.user.name,
        email: member.user.email,
        image: member.user.image,
      }));
    }),

  /** Admin invites an existing member to become a Koshadhyaksh (Treasurer). */
  inviteTreasurer: protectedProcedure
    .input(z.object({ koshId: koshIdSchema, userId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const koshData = await getKosh(input.koshId);
      if (!koshData) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Kosh not found" });
      }

      const adminMembership = await getActiveMembership(input.koshId, ctx.session.user.id);
      if (!adminMembership || adminMembership.role !== "adhyaksh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the Adhyaksh can invite treasurers",
        });
      }

      const targetMembership = await getActiveMembership(
        input.koshId,
        input.userId,
      );
      if (!targetMembership) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "That user is not an active member of this kosh",
        });
      }
      if (targetMembership.role !== "sadasya") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "That member already holds a management role",
        });
      }

      const duplicate = await db.query.koshRoleRequest.findFirst({
        where: (r, { and: a, eq: q }) =>
          a(
            q(r.koshId, input.koshId),
            q(r.inviteeId, input.userId),
            q(r.status, "pending"),
          ),
        columns: { id: true },
      });
      if (duplicate) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This member already has a pending treasurer invitation",
        });
      }

      return db.transaction(async (tx) => {
        const [row] = await tx
          .insert(koshRoleRequest)
          .values({
            koshId: input.koshId,
            invitedBy: ctx.session.user.id,
            inviteeId: input.userId,
            targetRole: "koshadhyaksh",
            status: "pending",
          })
          .returning();

        if (!row) throw new Error("Invitation insert returned no row");

        await tx.insert(notification).values({
          userId: input.userId,
          koshId: input.koshId,
          type: "treasurer_invite",
          requiresAction: true,
          title: "Koshadhyaksh (Treasurer) invitation",
          body: `${ctx.session.user.name} invited you to become a Koshadhyaksh (Treasurer) for ${koshData.name}`,
          data: {
            koshId: input.koshId,
            requestId: row.id,
            screen: "treasurer-invites",
          },
        });

        return row;
      });
    }),

  /**
   * The invited member accepts (becomes a Koshadhyaksh) or rejects with an
   * optional reason. The admin who invited them is notified either way.
   */
  respondTreasurerInvite: protectedProcedure
    .input(
      z.object({
        requestId: z.string().uuid(),
        accept: z.boolean(),
        reason: z.string().trim().max(300).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const request = await db.query.koshRoleRequest.findFirst({
        where: (r, { eq: q }) => q(r.id, input.requestId),
      });
      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }
      if (request.inviteeId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This invitation is not addressed to you",
        });
      }
      if (request.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has already been responded to",
        });
      }

      const koshData = await getKosh(request.koshId);

      const result = await db.transaction(async (tx) => {
        if (input.accept) {
          const membership = await tx.query.koshMembership.findFirst({
            where: (m, { and: a, eq: q }) =>
              a(
                q(m.koshId, request.koshId),
                q(m.userId, ctx.session.user.id),
                q(m.status, "active"),
              ),
          });
          if (!membership) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "You are not an active member of this kosh",
            });
          }

          const [updated] = await tx
            .update(koshMembership)
            .set({ role: request.targetRole })
            .where(
              and(
                eq(koshMembership.koshId, request.koshId),
                eq(koshMembership.userId, ctx.session.user.id),
              ),
            )
            .returning();

          const [resolved] = await tx
            .update(koshRoleRequest)
            .set({ status: "accepted", decidedAt: new Date() })
            .where(eq(koshRoleRequest.id, input.requestId))
            .returning();

          if (!updated || !resolved) {
            throw new Error("Failed to accept invitation");
          }
          return resolved;
        }

        const [resolved] = await tx
          .update(koshRoleRequest)
          .set({
            status: "rejected",
            reason: input.reason?.trim() ? input.reason.trim() : null,
            decidedAt: new Date(),
          })
          .where(eq(koshRoleRequest.id, input.requestId))
          .returning();

        if (!resolved) throw new Error("Failed to reject invitation");
        return resolved;
      });

      const inviteeName = ctx.session.user.name;
      const reasonSuffix = result.reason?.trim()
        ? ` Reason: ${result.reason.trim()}`
        : "";

      await db.insert(notification).values({
        userId: request.invitedBy,
        koshId: request.koshId,
        type: "role_changed",
        requiresAction: false,
        title: "Koshadhyaksh (Treasurer) invitation update",
        body:
          result.status === "accepted"
            ? `${inviteeName} accepted your invitation to become a Koshadhyaksh (Treasurer) for ${koshData?.name ?? "your kosh"}`
            : `${inviteeName} rejected your invitation to become a Koshadhyaksh (Treasurer) for ${koshData?.name ?? "your kosh"}.${reasonSuffix}`,
        data: { koshId: request.koshId, requestId: result.id },
      });

      return result;
    }),

  /** All treasurer invitations for a kosh — visible to the Adhyaksh/Koshadhyaksh. */
  treasurerRequests: protectedProcedure
    .input(z.object({ koshId: koshIdSchema }))
    .query(async ({ ctx, input }) => {
      const membership = await getActiveMembership(
        input.koshId,
        ctx.session.user.id,
      );
      if (
        !membership ||
        (membership.role !== "adhyaksh" &&
          membership.role !== "koshadhyaksh")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the Adhyaksh or Koshadhyaksh can view invitations",
        });
      }

      return db.query.koshRoleRequest.findMany({
        where: (r, { eq: q }) => q(r.koshId, input.koshId),
        with: {
          invitee: { columns: { id: true, name: true, email: true, image: true } },
          inviter: { columns: { id: true, name: true } },
        },
        orderBy: (r, { desc }) => [desc(r.createdAt)],
      });
    }),

  /** Pending treasurer invitations addressed to the current user. */
  pendingTreasurerInvites: protectedProcedure.query(async ({ ctx }) => {
    const requests = await db.query.koshRoleRequest.findMany({
      where: (r, { and: a, eq: q }) =>
        a(q(r.inviteeId, ctx.session.user.id), q(r.status, "pending")),
      with: {
        kosh: { columns: { id: true, name: true } },
        inviter: { columns: { id: true, name: true } },
      },
      orderBy: (r, { desc }) => [desc(r.createdAt)],
    });

    return requests.map((request) => ({
      id: request.id,
      koshId: request.koshId,
      koshName: request.kosh.name,
      invitedByName: request.inviter.name,
      targetRole: request.targetRole,
      createdAt: request.createdAt,
    }));
  }),
});

export type InviteTreasurerInput = {
  koshId: string;
  userId: string;
};

export type RespondTreasurerInviteInput = {
  requestId: string;
  accept: boolean;
  reason?: string;
};