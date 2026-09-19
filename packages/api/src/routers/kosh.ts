import { auth } from "@kosh-app/auth";
import { sendTransactionPinResetEmail } from "@kosh-app/auth/email";
import { db } from "@kosh-app/db";
import { user, verification } from "@kosh-app/db/schema/auth";
import { contribution } from "@kosh-app/db/schema/contributions";
import { kosh, koshMembership, koshPeriod } from "@kosh-app/db/schema/kosh";
import { loan, loanRepayment } from "@kosh-app/db/schema/loans";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, lt, or, sql } from "drizzle-orm";
import { randomInt } from "node:crypto";
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

export type KoshDetail = Omit<KoshListItem, "joinedAt"> & {
  joinedAt: string | null;
  members: {
    userId: string;
    name: string | null;
    image: string | null;
    role: "adhyaksh" | "koshadhyaksh" | "sadasya";
    joinedAt: string | null;
  }[];
  maxMembers: number | null;
  durationMonths: number;
  loanCap: string;
  memberInterestRate: string;
  nonMemberInterestRate: string;
  latePenaltyAmount: string | null;
  applyPenalty: boolean;
  penaltyGraceDays: number | null;
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

/** Full months between the kosh start date and today, inclusive of both
 * endpoints. Used to keep the duration from being shrunk past periods that
 * have already started. */
function elapsedMonthsSince(startDate: string, now = new Date()) {
  const [year, month] = startDate.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const current = new Date(now.getFullYear(), now.getMonth(), 1);
  return (
    (current.getFullYear() - start.getFullYear()) * 12 +
    (current.getMonth() - start.getMonth()) +
    1
  );
}

/** The list of contribution periods (`YYYY-MM-01`) that have already started,
 * from the kosh's start month through the current month, capped at the kosh's
 * end date. */
function startedPeriods(
  startDate: string,
  endDate: string,
  now = new Date(),
) {
  const [startYear, startMonth] = startDate.split("-").map(Number);
  const [endYear, endMonth] = endDate.split("-").map(Number);
  const start = new Date(startYear, startMonth - 1, 1);
  const end = new Date(endYear, endMonth - 1, 1);
  const current = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = current < end ? current : end;

  const periods: string[] = [];
  for (let d = start; d <= last; d = addMonths(d, 1)) {
    periods.push(toDateString(d));
  }
  return periods;
}

const updateKoshSchema = z.object({
  koshId: z.string().uuid(),
  name: z.string().trim().min(1, "Name is required").max(80),
  description: z.string().trim().max(500).optional(),
  iconUrl: z.string().max(500).optional(),
  monthlyAmount: z.number().positive().max(9_999_999_999),
  dueDay: z.number().int().min(1).max(28),
  memberInterestRate: z.number().min(0).max(100),
  nonMemberInterestRate: z.number().min(0).max(100),
  loanCap: z.number().positive().max(9_999_999_999),
  latePenaltyAmount: z.number().positive().optional(),
  applyPenalty: z.boolean().optional(),
  penaltyGraceDays: z.number().int().min(0).max(15).optional(),
  durationMonths: z.number().int().min(1).max(120),
  maxMembers: z.number().int().min(1).optional(),
});

export type UpdateKoshInput = z.infer<typeof updateKoshSchema>;

const updateTransactionPinSchema = z
  .object({
    koshId: z.string().uuid(),
    oldPin: z.string().regex(/^\d{6}$/, "Old PIN must be 6 digits"),
    newPin: z.string().regex(/^\d{6}$/, "New PIN must be 6 digits"),
    password: z.string().min(1, "Password is required"),
  })
  .refine((data) => data.oldPin !== data.newPin, {
    message: "New PIN must be different from the old PIN",
    path: ["newPin"],
  });

export type UpdateTransactionPinInput = z.infer<
  typeof updateTransactionPinSchema
>;

const requestTransactionPinResetSchema = z.object({
  koshId: z.string().uuid(),
});

const resetTransactionPinSchema = z.object({
  koshId: z.string().uuid(),
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
  newPin: z.string().regex(/^\d{6}$/, "New PIN must be 6 digits"),
  password: z.string().min(1, "Password is required"),
});

const TRANSACTION_PIN_RESET_IDENTIFIER = (koshId: string) =>
  `transaction-pin-reset:${koshId}`;

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  return `${local.slice(0, 1)}***@${domain}`;
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

  getById: protectedProcedure
    .input(z.object({ koshId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const membership = await db
        .select()
        .from(koshMembership)
        .where(
          and(
            eq(koshMembership.koshId, input.koshId),
            eq(koshMembership.userId, userId),
            eq(koshMembership.status, "active"),
          ),
        )
        .limit(1);

      if (!membership[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "You are not a member of this kosh",
        });
      }

      const role = membership[0].role;

      const [koshRow] = await db
        .select()
        .from(kosh)
        .where(eq(kosh.id, input.koshId))
        .limit(1);

      if (!koshRow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Kosh not found",
        });
      }

      const [memberCountRow] = await db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(koshMembership)
        .where(
          and(
            eq(koshMembership.koshId, input.koshId),
            eq(koshMembership.status, "active"),
          ),
        );

      const [contribRow] = await db
        .select({
          collected: sql<string>`coalesce(sum(${contribution.contributionAmount}), 0) + coalesce(sum(${contribution.penaltyPaid}), 0)`,
        })
        .from(contribution)
        .where(eq(contribution.koshId, input.koshId));

      const [interestRow] = await db
        .select({
          interest: sql<string>`coalesce(sum(${loanRepayment.interestPortion}), 0)`,
        })
        .from(loanRepayment)
        .innerJoin(loan, eq(loanRepayment.loanId, loan.id))
        .where(eq(loan.koshId, input.koshId));

      const [loanRow] = await db
        .select({
          outstanding: sql<string>`coalesce(sum(${loan.amountRemaining}), 0)`,
        })
        .from(loan)
        .where(
          and(
            eq(loan.koshId, input.koshId),
            inArray(loan.status, ["active", "defaulted"]),
          ),
        );

      const collected =
        (parseFloat(contribRow?.collected ?? "0") || 0) +
        (parseFloat(interestRow?.interest ?? "0") || 0);
      const outstanding = parseFloat(loanRow?.outstanding ?? "0") || 0;

      const members = await db
        .select({
          userId: koshMembership.userId,
          name: user.name,
          image: user.image,
          role: koshMembership.role,
          joinedAt: koshMembership.joinedAt,
        })
        .from(koshMembership)
        .innerJoin(user, eq(koshMembership.userId, user.id))
        .where(
          and(
            eq(koshMembership.koshId, input.koshId),
            eq(koshMembership.status, "active"),
          ),
        )
        .orderBy(koshMembership.joinedAt);

      return {
        id: koshRow.id,
        name: koshRow.name,
        description: koshRow.description,
        iconUrl: koshRow.iconUrl,
        monthlyAmount: koshRow.monthlyAmount,
        currency: koshRow.currency,
        dueDay: koshRow.dueDay,
        latePenaltyAmount: koshRow.latePenaltyAmount,
        applyPenalty: koshRow.applyPenalty,
        penaltyGraceDays: koshRow.penaltyGraceDays,
        startDate: koshRow.startDate,
        endDate: koshRow.endDate,
        durationMonths: koshRow.durationMonths,
        role: role,
        joinedAt: membership[0].joinedAt?.toISOString() ?? null,
        memberCount: memberCountRow?.count ?? 0,
        totalCollected: String(collected),
        totalRemaining: String(collected - outstanding),
        maxMembers: koshRow.maxMembers,
        loanCap: koshRow.loanCap,
        memberInterestRate: koshRow.memberInterestRate,
        nonMemberInterestRate: koshRow.nonMemberInterestRate,
        members: members.map((m) => ({
          userId: m.userId,
          name: m.name,
          image: m.image,
          role: m.role,
          joinedAt: m.joinedAt?.toISOString() ?? null,
        })),
      } satisfies KoshDetail;
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
                input.applyPenalty && input.latePenaltyAmount != null
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

  update: protectedProcedure
    .input(updateKoshSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const membership = await db.query.koshMembership.findFirst({
        where: (m, { and, eq: q }) =>
          and(
            q(m.koshId, input.koshId),
            q(m.userId, userId),
            q(m.status, "active"),
          ),
        columns: { role: true },
      });

      if (membership?.role !== "adhyaksh" && membership?.role !== "koshadhyaksh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only an adhyaksh or koshadhyaksh can update the kosh",
        });
      }

      const [current] = await db
        .select({
          startDate: kosh.startDate,
          endDate: kosh.endDate,
          dueDay: kosh.dueDay,
          monthlyAmount: kosh.monthlyAmount,
          applyPenalty: kosh.applyPenalty,
          latePenaltyAmount: kosh.latePenaltyAmount,
          penaltyGraceDays: kosh.penaltyGraceDays,
        })
        .from(kosh)
        .where(eq(kosh.id, input.koshId))
        .limit(1);

      if (!current) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Kosh not found" });
      }

      const startDate = new Date(`${current.startDate}T00:00:00`);
      const endDate = toDateString(addMonths(startDate, input.durationMonths));

      // Guard 1: duration can be extended freely but never reduced below how
      // many periods have already started (start month through the current
      // month, inclusive).
      const elapsedMonths = elapsedMonthsSince(current.startDate);
      if (input.durationMonths < elapsedMonths) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Duration cannot be reduced below ${elapsedMonths} month${
            elapsedMonths === 1 ? "" : "s"
          } (the kosh is already ${elapsedMonths} period${
            elapsedMonths === 1 ? "" : "s"
          } in)`,
        });
      }

      // Guard 2: max members can go either way but never below the current
      // active member count.
      const [activeMemberRow] = await db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(koshMembership)
        .where(
          and(
            eq(koshMembership.koshId, input.koshId),
            eq(koshMembership.status, "active"),
          ),
        );
      const activeMemberCount = activeMemberRow?.count ?? 0;
      if (input.maxMembers != null && input.maxMembers < activeMemberCount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Maximum members cannot be set below the current member count (${activeMemberCount})`,
        });
      }

      // Freeze the config for periods that have already started. If any
      // contribution-affecting setting (due day, monthly amount, penalty
      // rules) is changing, snapshot the OLD values for every started period
      // that isn't frozen yet — history and the in-progress month keep the old
      // rules; the new values apply only to periods that haven't begun. The
      // unique (koshId, period) constraint makes repeated edits idempotent.
      const newPeriodConfig = {
        dueDay: input.dueDay,
        monthlyAmount: String(input.monthlyAmount),
        applyPenalty: input.applyPenalty ?? false,
        latePenaltyAmount:
          input.applyPenalty && input.latePenaltyAmount != null
            ? String(input.latePenaltyAmount)
            : null,
        penaltyGraceDays: input.applyPenalty
          ? input.penaltyGraceDays ?? null
          : null,
      };
      const configChanged =
        newPeriodConfig.dueDay !== current.dueDay ||
        parseFloat(newPeriodConfig.monthlyAmount) !==
          parseFloat(current.monthlyAmount) ||
        newPeriodConfig.applyPenalty !== current.applyPenalty ||
        newPeriodConfig.latePenaltyAmount !== current.latePenaltyAmount ||
        newPeriodConfig.penaltyGraceDays !== current.penaltyGraceDays;

      if (configChanged) {
        const periods = startedPeriods(
          current.startDate,
          current.endDate,
        );
        if (periods.length > 0) {
          await db
            .insert(koshPeriod)
            .values(
              periods.map((period) => ({
                koshId: input.koshId,
                period,
                dueDay: current.dueDay,
                monthlyAmount: current.monthlyAmount,
                applyPenalty: current.applyPenalty,
                latePenaltyAmount: current.latePenaltyAmount,
                penaltyGraceDays: current.penaltyGraceDays,
              })),
            )
            .onConflictDoNothing();
        }
      }

      try {
        const [updated] = await db
          .update(kosh)
          .set({
            name: input.name,
            description: input.description || null,
            iconUrl: input.iconUrl || null,
            monthlyAmount: newPeriodConfig.monthlyAmount,
            dueDay: newPeriodConfig.dueDay,
            memberInterestRate: String(input.memberInterestRate),
            nonMemberInterestRate: String(input.nonMemberInterestRate),
            loanCap: String(input.loanCap),
            applyPenalty: newPeriodConfig.applyPenalty,
            latePenaltyAmount: newPeriodConfig.latePenaltyAmount,
            penaltyGraceDays: newPeriodConfig.penaltyGraceDays,
            durationMonths: input.durationMonths,
            maxMembers: input.maxMembers ?? null,
            endDate,
          })
          .where(eq(kosh.id, input.koshId))
          .returning();

        if (!updated) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Kosh not found",
          });
        }

        return updated;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update kosh",
          cause: error,
        });
      }
    }),

  updateTransactionPin: protectedProcedure
    .input(updateTransactionPinSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Only an active adhyaksh or koshadhyaksh can change the transaction PIN.
      const membership = await db.query.koshMembership.findFirst({
        where: (m, { and, eq: q }) =>
          and(
            q(m.koshId, input.koshId),
            q(m.userId, userId),
            q(m.status, "active"),
          ),
        columns: { role: true },
      });
      if (
        membership?.role !== "adhyaksh" &&
        membership?.role !== "koshadhyaksh"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Only an adhyaksh or koshadhyaksh can update the transaction PIN",
        });
      }

      const [current] = await db
        .select({ transactionPin: kosh.transactionPin })
        .from(kosh)
        .where(eq(kosh.id, input.koshId))
        .limit(1);
      if (!current) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Kosh not found" });
      }

      if (current.transactionPin !== input.oldPin) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The current transaction PIN is incorrect",
        });
      }

      // Re-confirm the account holder's password before applying the change.
      try {
        await auth.api.verifyPassword({
          body: { password: input.password },
          headers: ctx.headers,
        });
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The password is incorrect",
        });
      }

      try {
        const [updated] = await db
          .update(kosh)
          .set({ transactionPin: input.newPin })
          .where(eq(kosh.id, input.koshId))
          .returning({ id: kosh.id });

        if (!updated) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Kosh not found",
          });
        }
        return updated;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update transaction PIN",
          cause: error,
        });
      }
    }),

  requestTransactionPinReset: protectedProcedure
    .input(requestTransactionPinResetSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const membership = await db.query.koshMembership.findFirst({
        where: (m, { and: q, eq: e }) =>
          and(
            e(m.koshId, input.koshId),
            e(m.userId, userId),
            e(m.status, "active"),
          ),
        columns: { role: true },
      });
      if (
        membership?.role !== "adhyaksh" &&
        membership?.role !== "koshadhyaksh"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Only an adhyaksh or koshadhyaksh can reset the transaction PIN",
        });
      }

      const email = ctx.session.user.email;
      if (!email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No email address on this account",
        });
      }

      const otp = randomInt(0, 1_000_000).toString().padStart(6, "0");
      const identifier = TRANSACTION_PIN_RESET_IDENTIFIER(input.koshId);
      const expiresAt = new Date(Date.now() + 600_000);

      // Replace any existing OTP for this kosh (single active code).
      await db.delete(verification).where(eq(verification.identifier, identifier));
      await db.insert(verification).values({
        id: crypto.randomUUID(),
        identifier,
        value: otp,
        expiresAt,
      });

      try {
        await sendTransactionPinResetEmail({
          to: email,
          otp,
          name: ctx.session.user.name || undefined,
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send the reset code",
          cause: error,
        });
      }

      return { maskedEmail: maskEmail(email) };
    }),

  resetTransactionPin: protectedProcedure
    .input(resetTransactionPinSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const membership = await db.query.koshMembership.findFirst({
        where: (m, { and: q, eq: e }) =>
          and(
            e(m.koshId, input.koshId),
            e(m.userId, userId),
            e(m.status, "active"),
          ),
        columns: { role: true },
      });
      if (
        membership?.role !== "adhyaksh" &&
        membership?.role !== "koshadhyaksh"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Only an adhyaksh or koshadhyaksh can reset the transaction PIN",
        });
      }

      const identifier = TRANSACTION_PIN_RESET_IDENTIFIER(input.koshId);
      const [stored] = await db
        .select({ value: verification.value, expiresAt: verification.expiresAt })
        .from(verification)
        .where(eq(verification.identifier, identifier))
        .limit(1);
      if (!stored || stored.value !== input.otp) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The reset code is invalid",
        });
      }
      if (stored.expiresAt.getTime() < Date.now()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The reset code has expired",
        });
      }

      // Re-confirm the account holder's password before applying the change.
      try {
        await auth.api.verifyPassword({
          body: { password: input.password },
          headers: ctx.headers,
        });
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The password is incorrect",
        });
      }

      try {
        const [updated] = await db
          .update(kosh)
          .set({ transactionPin: input.newPin })
          .where(eq(kosh.id, input.koshId))
          .returning({ id: kosh.id });

        if (!updated) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Kosh not found",
          });
        }

        // Single-use: consume the OTP after a successful reset.
        await db
          .delete(verification)
          .where(eq(verification.identifier, identifier));

        return updated;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to reset transaction PIN",
          cause: error,
        });
      }
    }),
});