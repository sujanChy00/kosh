import { db } from "@kosh-app/db";
import { user } from "@kosh-app/db/schema/auth";
import { contribution } from "@kosh-app/db/schema/contributions";
import { kosh, koshMembership } from "@kosh-app/db/schema/kosh";
import { loan, loanRepayment } from "@kosh-app/db/schema/loans";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, lt, or, sql } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

const listKoshSchema = z.object({
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.string().nullable().optional(),
});

export type KoshListItem = {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  monthlyAmount: string;
  currency: string;
  dueDay: number;
  startDate: string;
  endDate: string;
  role: "adhyaksh" | "koshadhyaksh" | "sadasya";
  joinedAt: string | null;
  memberCount: number;
  totalCollected: string;
  totalRemaining: string;
};

const createKoshSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(80),
    description: z.string().trim().max(500).optional(),
    iconUrl: z.string().max(500).optional(),
    monthlyAmount: z.number().positive().max(9_999_999_999),
    dueDay: z.number().int().min(1).max(28),
    memberInterestRate: z.number().min(0).max(100),
    nonMemberInterestRate: z.number().min(0).max(100),
    loanCap: z.number().positive().max(9_999_999_999),
    latePenaltyAmount: z.number().positive().optional(),
    // When applyPenalty is on, the late penalty kicks in `penaltyGraceDays`
    // days after the due date; omitting it means the day after the due date.
    applyPenalty: z.boolean().optional(),
    penaltyGraceDays: z.number().int().min(0).max(15).optional(),
    // Optional: when omitted the server defaults it to today.
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date")
      .optional(),
    durationMonths: z.number().int().min(1).max(120),
    maxMembers: z.number().int().min(1).optional(),
    transactionPin: z
      .string()
      .regex(/^\d{6}$/, "Transaction PIN must be 6 digits"),
  })
  .refine(
    (data) => {
      if (!data.startDate) return true;
      const today = toDateString(new Date());
      return data.startDate <= today;
    },
    { message: "Start date cannot be in the future", path: ["startDate"] },
  );

export type CreateKoshInput = z.infer<typeof createKoshSchema>;

function toDateString(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addMonths(date: Date, months: number) {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}

export const koshRouter = router({
  /** The kosh the current user is an active member of, newest first. */
  list: protectedProcedure
    .input(listKoshSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const limit = input.limit ?? 20;

      const baseFilter = and(
        eq(koshMembership.userId, userId),
        eq(koshMembership.status, "active"),
      );

      // Keyset pagination, ordered by kosh.createdAt DESC, kosh.id DESC.
      // Cursor shape: `${createdAt.getTime()}|${koshId}`.
      const cursorFilter = input.cursor
        ? (() => {
            const [timestamp, id] = input.cursor.split("|");
            const cursorTime = new Date(Number(timestamp));
            if (!id || Number.isNaN(cursorTime.getTime())) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Invalid pagination cursor",
              });
            }
            return or(
              lt(kosh.createdAt, cursorTime),
              and(eq(kosh.createdAt, cursorTime), lt(kosh.id, id)),
            );
          })()
        : undefined;

      const rows = await db
        .select({
          membership: {
            role: koshMembership.role,
            joinedAt: koshMembership.joinedAt,
          },
          kosh: {
            id: kosh.id,
            name: kosh.name,
            description: kosh.description,
            iconUrl: kosh.iconUrl,
            monthlyAmount: kosh.monthlyAmount,
            currency: kosh.currency,
            dueDay: kosh.dueDay,
            latePenaltyAmount: kosh.latePenaltyAmount,
            applyPenalty: kosh.applyPenalty,
            penaltyGraceDays: kosh.penaltyGraceDays,
            startDate: kosh.startDate,
            endDate: kosh.endDate,
            createdAt: kosh.createdAt,
          },
          memberCount: sql<number>`(
            select count(*)::int
            from ${koshMembership}
            where ${koshMembership.koshId} = ${kosh.id}
              and ${koshMembership.status} = 'active'
          )`,
          // totalCollected: lifetime money that has genuinely entered the kosh.
          // Contributions + collected penalties + interest actually received.
          // Loan principal is NOT re-counted here — it was already counted once
          // when originally contributed, so re-adding it on repayment would
          // double-count it.
          totalCollected: sql<string>`(
            (
              select coalesce(sum(${contribution.contributionAmount}), 0)
                     + coalesce(sum(${contribution.penaltyPaid}), 0)
              from ${contribution}
              where ${contribution.koshId} = ${kosh.id}
            ) + coalesce((
              select sum(${loanRepayment.interestPortion})
              from ${loanRepayment}
              inner join ${loan} on ${loan.id} = ${loanRepayment.loanId}
              where ${loan.koshId} = ${kosh.id}
            ), 0)
          )`,
          // totalRemaining: actual liquid balance right now. Active AND
          // defaulted loans both still reduce this (defaulted balances are
          // money genuinely gone); paid_off loans are excluded (balance is 0).
          totalRemaining: sql<string>`(
            (
              (
                select coalesce(sum(${contribution.contributionAmount}), 0)
                       + coalesce(sum(${contribution.penaltyPaid}), 0)
                from ${contribution}
                where ${contribution.koshId} = ${kosh.id}
              ) + coalesce((
                select sum(${loanRepayment.interestPortion})
                from ${loanRepayment}
                inner join ${loan} on ${loan.id} = ${loanRepayment.loanId}
                where ${loan.koshId} = ${kosh.id}
              ), 0)
            ) - (
              select coalesce(sum(${loan.amountRemaining}), 0)
              from ${loan}
              where ${loan.koshId} = ${kosh.id}
                and ${loan.status} in ('active', 'defaulted')
            )
          )`,
        })
        .from(koshMembership)
        .innerJoin(kosh, eq(koshMembership.koshId, kosh.id))
        .where(and(baseFilter, cursorFilter))
        .orderBy(desc(kosh.createdAt), desc(kosh.id))
        .limit(limit + 1);

      const hasMore = rows.length > limit;
      const page = rows.slice(0, limit);
      const last = page[page.length - 1];

      return {
        items: page.map((row) => ({
          id: row.kosh.id,
          name: row.kosh.name,
          description: row.kosh.description,
          iconUrl: row.kosh.iconUrl,
          monthlyAmount: row.kosh.monthlyAmount,
          currency: row.kosh.currency,
          dueDay: row.kosh.dueDay,
          latePenaltyAmount: row.kosh.latePenaltyAmount,
          applyPenalty: row.kosh.applyPenalty,
          penaltyGraceDays: row.kosh.penaltyGraceDays,
          startDate: row.kosh.startDate,
          endDate: row.kosh.endDate,
          role: row.membership.role,
          joinedAt: row.membership.joinedAt,
          memberCount: row.memberCount,
          totalCollected: row.totalCollected,
          totalRemaining: row.totalRemaining,
        })),
        nextCursor:
          hasMore && last
            ? `${last.kosh.createdAt.getTime()}|${last.kosh.id}`
            : null,
      };
    }),

  create: protectedProcedure
    .input(createKoshSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Default the start date to today when not provided.
      const startDate = input.startDate
        ? new Date(`${input.startDate}T00:00:00`)
        : new Date();
      const endDate = addMonths(startDate, input.durationMonths);

      try {
        const created = await db.transaction(async (tx) => {
          const [row] = await tx
            .insert(kosh)
            .values({
              name: input.name,
              description: input.description || null,
              iconUrl: input.iconUrl || null,
              monthlyAmount: String(input.monthlyAmount),
              dueDay: input.dueDay,
              currency: "NPR", // fixed to Nepali Rupees
              memberInterestRate: String(input.memberInterestRate),
              nonMemberInterestRate: String(input.nonMemberInterestRate),
              loanCap: String(input.loanCap),
              latePenaltyAmount:
                input.latePenaltyAmount != null
                  ? String(input.latePenaltyAmount)
                  : null,
              applyPenalty: input.applyPenalty ?? false,
              penaltyGraceDays: input.applyPenalty
                ? input.penaltyGraceDays ?? null
                : null,
              startDate: toDateString(startDate),
              durationMonths: input.durationMonths,
              endDate: toDateString(endDate),
              maxMembers: input.maxMembers ?? null,
              transactionPin: input.transactionPin,
              createdBy: userId,
            })
            .returning();

          if (!row) {
            throw new Error("Kosh insert returned no row");
          }

          await tx.insert(koshMembership).values({
            koshId: row.id,
            userId,
            role: "adhyaksh",
            status: "active",
            joinedAt: new Date(),
          });

          await tx
            .update(user)
            .set({ selectedKoshId: row.id })
            .where(eq(user.id, userId));

          return row;
        });

        return created;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create kosh",
          cause: error,
        });
      }
    }),
});