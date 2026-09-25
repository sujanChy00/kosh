import { db } from "@kosh-app/db";
import { user } from "@kosh-app/db/schema/auth";
import { contribution } from "@kosh-app/db/schema/contributions";
import { koshPeriod } from "@kosh-app/db/schema/kosh";
import { loan, loanRepayment } from "@kosh-app/db/schema/loans";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, inArray, lt, lte, or } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

// ─── Period helpers ─────────────────────────────────────────────────────────
// A contribution period is the first day of a month (e.g. "2026-09-01");
// it represents that whole contribution month. A period's due date is the
// kosh's `dueDay` within that month.

const periodSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])-01$/, "Invalid period");

// Shared by the default-period rule and the "recorded late" badge so the two
// stay in sync.
const LATE_THRESHOLD_DAYS = 5;

// The late penalty kicks in `penaltyGraceDays` days after the due date. A
// stored null grace means the day after the due date (1 day). When the kosh
// has applyPenalty off, no penalty is ever due.
const penaltyGraceDaysFor = (koshRow: { penaltyGraceDays: number | null }) =>
  koshRow.penaltyGraceDays ?? 1;

const isPenaltyDueFor = (
  koshRow: {
    applyPenalty: boolean;
    latePenaltyAmount: string | null;
    penaltyGraceDays: number | null;
  },
  dueDate: Date,
) =>
  koshRow.applyPenalty &&
  koshRow.latePenaltyAmount != null &&
  daysBetween(dueDate) >= penaltyGraceDaysFor(koshRow);

const DAY_MS = 86_400_000;

const pad2 = (n: number) => String(n).padStart(2, "0");

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toDateString(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate(),
  )}`;
}

function periodToParts(period: string) {
  const [yearStr, monthStr] = period.split("-");
  return { year: Number(yearStr), month: Number(monthStr) };
}

function periodFromParts(year: number, month: number) {
  const d = new Date(year, month - 1, 1); // normalizes overflow/underflow
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-01`;
}

function periodLabel(period: string) {
  const { year, month } = periodToParts(period);
  const label = new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
  });
  return `${label} ${year}`;
}

function dueDateFor(period: string, dueDay: number) {
  const { year, month } = periodToParts(period);
  return new Date(year, month - 1, dueDay);
}

function daysBetween(from: Date) {
  return Math.round(
    (startOfDay(new Date()).getTime() - startOfDay(from).getTime()) / DAY_MS,
  );
}

function daysUntil(date: Date, now = new Date()) {
  return Math.round(
    (startOfDay(date).getTime() - startOfDay(now).getTime()) / DAY_MS,
  );
}

/**
 * The period that makes sense to be working on today, per the agreed rule:
 * if today is more than 5 days before the next occurrence of the kosh's due
 * day, we default to the previous period (the one whose due date already
 * passed); otherwise to the upcoming period (the one whose due date is coming
 * up or just passed).
 */
function defaultPeriodFor(dueDay: number, today = new Date()) {
  const anchor = startOfDay(today);
  const thisDue = new Date(today.getFullYear(), today.getMonth(), dueDay);

  let offset: number;
  if (anchor.getTime() > thisDue.getTime()) {
    // This month's due date already passed. If the next occurrence (next
    // month) is more than 5 days away we stay on this month — the period
    // whose due date just passed; otherwise we jump ahead to it.
    const nextDue = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
    offset = daysUntil(nextDue, today) > LATE_THRESHOLD_DAYS ? 0 : 1;
  } else {
    // This month's due date is still ahead. More than 5 days out → default
    // to the previous period; within 5 days → this upcoming period.
    offset = daysUntil(thisDue, today) > LATE_THRESHOLD_DAYS ? -1 : 0;
  }

  return periodFromParts(today.getFullYear(), today.getMonth() + 1 + offset);
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// ─── Schemas ────────────────────────────────────────────────────────────────

const koshIdSchema = z.uuid();

const recordEntrySchema = z.object({
  memberId: z.string().min(1),
  contributionAmount: z.number().min(0).optional(),
  penaltyPaid: z.number().min(0).optional(),
  repaymentAmount: z.number().min(0).optional(),
});

export type RecordEntryInput = z.infer<typeof recordEntrySchema>;

// ─── Shared helpers ─────────────────────────────────────────────────────────

async function requireAdhyaksh(koshId: string, userId: string) {
  const membership = await db.query.koshMembership.findFirst({
    where: (m, { and: a, eq: q }) =>
      a(q(m.koshId, koshId), q(m.userId, userId), q(m.status, "active")),
    columns: { role: true },
  });
  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a member of this kosh",
    });
  }
  if (membership.role !== "adhyaksh") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only the Adhyaksh can record contributions",
    });
  }

  const koshRow = await db.query.kosh.findFirst({
    where: (k, { eq: q }) => q(k.id, koshId),
    columns: {
      id: true,
      name: true,
      currency: true,
      monthlyAmount: true,
      dueDay: true,
      latePenaltyAmount: true,
      applyPenalty: true,
      penaltyGraceDays: true,
    },
  });
  if (!koshRow) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Kosh not found" });
  }
  return { koshRow };
}

/**
 * Resolve the config that applies to one contribution period.
 *
 * A `kosh_period` row freezes the config (due day, monthly amount, penalty
 * settings) that was in force when the period was first touched or when the
 * kosh was edited after that period started. If a snapshot exists, those
 * frozen values win so that later edits never retroactively rewrite history
 * (e.g. changing the due date from 10 to 5 mid-month must not penalize people
 * for the 10th). When no snapshot exists yet, this is the period's first
 * touch: we snapshot the kosh's *current* config and return it, making the
 * config deterministic from here on.
 */
async function resolvePeriodConfig(
  koshId: string,
  period: string,
  fallback: {
    monthlyAmount: string;
    dueDay: number;
    latePenaltyAmount: string | null;
    applyPenalty: boolean;
    penaltyGraceDays: number | null;
  },
) {
  const snapshot = await db.query.koshPeriod.findFirst({
    where: (p, { and: a, eq: q }) =>
      a(q(p.koshId, koshId), q(p.period, period)),
  });

  if (snapshot) {
    return {
      monthlyAmount: snapshot.monthlyAmount,
      dueDay: snapshot.dueDay,
      latePenaltyAmount: snapshot.latePenaltyAmount,
      applyPenalty: snapshot.applyPenalty,
      penaltyGraceDays: snapshot.penaltyGraceDays,
    };
  }

  // First touch: freeze the config currently in force for this period. The
  // unique (koshId, period) constraint makes racing touches idempotent.
  await db
    .insert(koshPeriod)
    .values({
      koshId,
      period,
      monthlyAmount: fallback.monthlyAmount,
      dueDay: fallback.dueDay,
      latePenaltyAmount: fallback.latePenaltyAmount,
      applyPenalty: fallback.applyPenalty,
      penaltyGraceDays: fallback.penaltyGraceDays,
    })
    .onConflictDoNothing();

  return fallback;
}

/**
 * Interest-first repayment split. Simple interest accrues on the loan's
 * principal from issue date to today; interest already collected in previous
 * repayments is netted off, contemporary accrued interest is paid down first,
 * and the remainder reduces principal. The principal portion can never push
 * the loan's remaining balance below zero.
 */
function computeRepaymentSplit(
  loanRow: {
    principal: string;
    interestRate: string;
    issueDate: string;
    amountRemaining: string;
  },
  payment: number,
  paidInterest: number,
) {
  const principal = parseFloat(loanRow.principal);
  const rate = parseFloat(loanRow.interestRate); // % per year
  const remaining = parseFloat(loanRow.amountRemaining);
  const days = Math.max(
    0,
    daysBetween(new Date(`${loanRow.issueDate}T00:00:00`)),
  );
  const accrued = principal * (rate / 100) * (days / 365);
  const interestOwed = round2(Math.max(0, accrued - paidInterest));
  const maxPayment = round2(remaining + interestOwed);

  if (payment - maxPayment > 0.005) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Repayment amount (${payment}) exceeds the outstanding loan balance of ${maxPayment}`,
    });
  }

  const interestPortion = round2(Math.min(payment, interestOwed));
  const principalPortion = round2(payment - interestPortion);
  const remainingAfter = round2(Math.max(0, remaining - principalPortion));

  return { interestPortion, principalPortion, remainingAfter };
}

/**
 * The per-member, per-period write. The contribution record and the loan
 * repayment are deliberately written as two independent operations — a
 * repayment failure must never block or roll back a saved contribution.
 */
async function applyMemberEntry(input: {
  koshRow: {
    id: string;
    monthlyAmount: string;
    latePenaltyAmount: string | null;
  };
  period: string;
  isPastDue: boolean;
  isPenaltyDue: boolean;
  entry: RecordEntryInput;
  actorId: string;
}) {
  const { koshRow, period, isPastDue, isPenaltyDue, entry, actorId } = input;

  const membership = await db.query.koshMembership.findFirst({
    where: (m, { and: a, eq: q }) =>
      a(
        q(m.koshId, koshRow.id),
        q(m.userId, entry.memberId),
        q(m.status, "active"),
      ),
    columns: { userId: true },
  });
  if (!membership) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This member is not an active member of the kosh",
    });
  }

  // ── Contribution write ─────────────────────────────────────────────────
  const existing = await db.query.contribution.findFirst({
    where: (c, { and: a, eq: q }) =>
      a(
        q(c.koshId, koshRow.id),
        q(c.memberId, entry.memberId),
        q(c.period, period),
      ),
  });

  const priorRows = await db
    .select()
    .from(contribution)
    .where(
      and(
        eq(contribution.koshId, koshRow.id),
        eq(contribution.memberId, entry.memberId),
        lt(contribution.period, period),
      ),
    );

  let priorContributionArrears = 0;
  let priorPenaltyArrears = 0;
  for (const r of priorRows) {
    priorContributionArrears += round2(
      Math.max(
        0,
        parseFloat(r.expectedAmount) - parseFloat(r.contributionAmount),
      ),
    );
    priorPenaltyArrears += round2(
      Math.max(
        0,
        parseFloat(r.penaltyAssessed) - parseFloat(r.penaltyPaid),
      ),
    );
  }

  const expected = existing
    ? parseFloat(existing.expectedAmount)
    : parseFloat(koshRow.monthlyAmount);

  const contributionAmount =
    entry.contributionAmount != null
      ? round2(entry.contributionAmount)
      : existing
        ? parseFloat(existing.contributionAmount)
        : 0;

  if (contributionAmount < 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Contribution amount cannot be negative",
    });
  }

  const maxContributionAllowed = round2(expected + priorContributionArrears);

  if (contributionAmount > maxContributionAllowed) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Contribution amount (${contributionAmount}) cannot exceed total contribution due of ${maxContributionAllowed}`,
    });
  }

  const penaltyPaid =
    entry.penaltyPaid != null
      ? round2(entry.penaltyPaid)
      : existing
        ? parseFloat(existing.penaltyPaid)
        : 0;

  if (penaltyPaid < 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Penalty paid cannot be negative",
    });
  }

  const computedAssessed =
    isPenaltyDue && koshRow.latePenaltyAmount != null
      ? parseFloat(koshRow.latePenaltyAmount)
      : 0;
  const penaltyAssessed = round2(
    Math.max(
      existing ? parseFloat(existing.penaltyAssessed) : computedAssessed,
      0,
    ),
  );

  const maxPenaltyAllowed = round2(penaltyAssessed + priorPenaltyArrears);

  if (penaltyPaid > maxPenaltyAllowed) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Penalty paid (${penaltyPaid}) cannot exceed total penalty due of ${maxPenaltyAllowed}`,
    });
  }

  const effectivePenaltyPaid = penaltyPaid;

  let status: "paid" | "late" | "partial" | "pending";
  if (contributionAmount >= expected) status = "paid";
  else if (isPastDue) status = "late";
  else if (contributionAmount > 0) status = "partial";
  else status = "pending";

  const datePaid =
    contributionAmount + effectivePenaltyPaid > 0 ? new Date() : null;

  let contributionRow;
  if (existing) {
    [contributionRow] = await db
      .update(contribution)
      .set({
        contributionAmount: String(contributionAmount),
        penaltyAssessed: String(penaltyAssessed),
        penaltyPaid: String(effectivePenaltyPaid),
        status,
        datePaid,
      })
      .where(eq(contribution.id, existing.id))
      .returning();
  } else {
    [contributionRow] = await db
      .insert(contribution)
      .values({
        koshId: koshRow.id,
        memberId: entry.memberId,
        period,
        expectedAmount: String(expected),
        contributionAmount: String(contributionAmount),
        penaltyAssessed: String(penaltyAssessed),
        penaltyPaid: String(effectivePenaltyPaid),
        status,
        datePaid,
        recordedBy: actorId,
      })
      .returning();
  }
  if (!contributionRow) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to write the contribution record",
    });
  }

  // ── Loan repayment write (independent of the contribution above) ─────
  let repayment: {
    id: string;
    principalPortion: string;
    interestPortion: string;
    remainingBalanceAfter: string;
  } | null = null;

  const repaymentAmount = entry.repaymentAmount ?? 0;
  if (repaymentAmount < 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Loan repayment amount cannot be negative",
    });
  }

  if (repaymentAmount > 0) {
    const activeLoan = await db.query.loan.findFirst({
      where: (l, { and: a, eq: q }) =>
        a(
          q(l.koshId, koshRow.id),
          q(l.borrowerId, entry.memberId),
          q(l.status, "active"),
        ),
      columns: {
        id: true,
        principal: true,
        interestRate: true,
        issueDate: true,
        amountRemaining: true,
      },
    });
    if (!activeLoan) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This member has no active loan to repay",
      });
    }

    const paidInterest = (
      await db
        .select({ i: loanRepayment.interestPortion })
        .from(loanRepayment)
        .where(eq(loanRepayment.loanId, activeLoan.id))
    ).reduce((sum, row) => sum + parseFloat(row.i ?? "0"), 0);

    const split = computeRepaymentSplit(
      activeLoan,
      repaymentAmount,
      paidInterest,
    );

    const [repaymentRow] = await db
      .insert(loanRepayment)
      .values({
        loanId: activeLoan.id,
        principalPortion: String(split.principalPortion),
        interestPortion: String(split.interestPortion),
        remainingBalanceAfter: String(split.remainingAfter),
        recordedBy: actorId,
      })
      .returning();
    if (!repaymentRow) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to write the loan repayment",
      });
    }

    const paidOff = split.remainingAfter <= 0;
    await db
      .update(loan)
      .set({
        amountRemaining: String(split.remainingAfter),
        ...(paidOff ? { status: "paid_off" as const } : {}),
      })
      .where(eq(loan.id, activeLoan.id));

    repayment = {
      id: repaymentRow.id,
      principalPortion: repaymentRow.principalPortion,
      interestPortion: repaymentRow.interestPortion,
      remainingBalanceAfter: repaymentRow.remainingBalanceAfter,
    };
  }

  return {
    contribution: {
      id: contributionRow.id,
      status: contributionRow.status,
      contributionAmount: contributionRow.contributionAmount,
      penaltyAssessed: contributionRow.penaltyAssessed,
      penaltyPaid: contributionRow.penaltyPaid,
    },
    repayment,
  };
}

async function runBulk(
  koshId: string,
  period: string,
  entries: RecordEntryInput[],
  actorId: string,
) {
  const { koshRow } = await requireAdhyaksh(koshId, actorId);
  const periodConfig = await resolvePeriodConfig(koshRow.id, period, koshRow);
  const dueDate = dueDateFor(period, periodConfig.dueDay);
  const isPastDue = startOfDay(new Date()).getTime() > dueDate.getTime();
  const isPenaltyDue = isPenaltyDueFor(periodConfig, dueDate);

  const results = [];
  for (const entry of entries) {
    try {
      const saved = await applyMemberEntry({
        koshRow: {
          id: koshRow.id,
          monthlyAmount: periodConfig.monthlyAmount,
          latePenaltyAmount: periodConfig.latePenaltyAmount,
        },
        period,
        isPastDue,
        isPenaltyDue,
        entry,
        actorId,
      });
      results.push({ memberId: entry.memberId, ok: true, ...saved });
    } catch (error) {
      results.push({
        memberId: entry.memberId,
        ok: false,
        error:
          error instanceof TRPCError
            ? error.message
            : "Failed to record this member",
      });
    }
  }

  const failed = results.filter((r) => !r.ok).length;
  return { results, summary: { succeeded: results.length - failed, failed } };
}

async function queryContributionsByKosh(input: {
  koshId: string;
  userId: string;
  limit?: number;
  cursor?: string | null;
  statusGroup?: "all" | "paid" | "pending" | "late";
  memberId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const {
    koshId,
    userId,
    cursor,
    statusGroup = "all",
    memberId,
    dateFrom,
    dateTo,
  } = input;
  const limit = input.limit ?? 20;

  // Verify membership
  const membership = await db.query.koshMembership.findFirst({
    where: (m, { and: a, eq: q }) =>
      a(
        q(m.koshId, koshId),
        q(m.userId, userId),
        q(m.status, "active"),
      ),
  });

  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a member of this kosh",
    });
  }

  const conditions = [eq(contribution.koshId, koshId)];

  if (statusGroup === "paid") {
    conditions.push(inArray(contribution.status, ["paid", "late"]));
  } else if (statusGroup === "pending") {
    conditions.push(inArray(contribution.status, ["pending", "partial"]));
  } else if (statusGroup === "late") {
    conditions.push(eq(contribution.status, "late"));
  }

  if (memberId && memberId !== "all") {
    conditions.push(eq(contribution.memberId, memberId));
  }

  if (dateFrom) {
    conditions.push(gte(contribution.period, dateFrom));
  }

  if (dateTo) {
    conditions.push(lte(contribution.period, dateTo));
  }

  if (cursor) {
    const parts = cursor.split("|");
    const cPeriod = parts[0];
    const cTimestamp = parts[1];
    const cId = parts[2];
    if (cPeriod && cTimestamp && cId) {
      const cDate = new Date(Number(cTimestamp));
      conditions.push(
        or(
          lt(contribution.period, cPeriod),
          and(
            eq(contribution.period, cPeriod),
            lt(contribution.createdAt, cDate),
          ),
          and(
            eq(contribution.period, cPeriod),
            eq(contribution.createdAt, cDate),
            lt(contribution.id, cId),
          ),
        )!,
      );
    }
  }

  const rows = await db
    .select({
      contribution: {
        id: contribution.id,
        koshId: contribution.koshId,
        memberId: contribution.memberId,
        period: contribution.period,
        expectedAmount: contribution.expectedAmount,
        contributionAmount: contribution.contributionAmount,
        penaltyAssessed: contribution.penaltyAssessed,
        penaltyPaid: contribution.penaltyPaid,
        status: contribution.status,
        datePaid: contribution.datePaid,
        createdAt: contribution.createdAt,
      },
      member: {
        id: user.id,
        name: user.name,
        image: user.image,
      },
    })
    .from(contribution)
    .innerJoin(user, eq(contribution.memberId, user.id))
    .where(and(...conditions))
    .orderBy(
      desc(contribution.period),
      desc(contribution.createdAt),
      desc(contribution.id),
    )
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  const last = page[page.length - 1];

  // Fetch loan repayments for the members in this page for this kosh
  const pageMemberIds = Array.from(
    new Set(page.map((r) => r.contribution.memberId)),
  );

  const repayments =
    pageMemberIds.length > 0
      ? await db
          .select({
            borrowerId: loan.borrowerId,
            originalPrincipal: loan.principal,
            principalPortion: loanRepayment.principalPortion,
            interestPortion: loanRepayment.interestPortion,
            remainingBalanceAfter: loanRepayment.remainingBalanceAfter,
            date: loanRepayment.date,
          })
          .from(loanRepayment)
          .innerJoin(loan, eq(loanRepayment.loanId, loan.id))
          .where(
            and(
              eq(loan.koshId, koshId),
              inArray(loan.borrowerId, pageMemberIds),
            ),
          )
      : [];

  const repaymentByMemberDate = new Map<
    string,
    {
      originalPrincipal: string;
      principalPaid: number;
      interestPaid: number;
      remainingBalanceAfter: string;
    }
  >();
  for (const rep of repayments) {
    if (!rep.borrowerId || !rep.date) continue;
    const dateKey = `${rep.borrowerId}_${toDateString(rep.date)}`;
    const existing = repaymentByMemberDate.get(dateKey) ?? {
      originalPrincipal: rep.originalPrincipal ?? "0",
      principalPaid: 0,
      interestPaid: 0,
      remainingBalanceAfter: rep.remainingBalanceAfter ?? "0",
    };
    existing.principalPaid += parseFloat(rep.principalPortion ?? "0");
    existing.interestPaid += parseFloat(rep.interestPortion ?? "0");
    existing.originalPrincipal = rep.originalPrincipal ?? existing.originalPrincipal;
    existing.remainingBalanceAfter = rep.remainingBalanceAfter ?? "0";
    repaymentByMemberDate.set(dateKey, existing);
  }

  const items = page.map((r) => {
    const dateKey = r.contribution.datePaid
      ? `${r.contribution.memberId}_${toDateString(r.contribution.datePaid)}`
      : null;
    const rep = dateKey ? repaymentByMemberDate.get(dateKey) : null;

    return {
      id: r.contribution.id,
      koshId: r.contribution.koshId,
      memberId: r.contribution.memberId,
      memberName: r.member.name,
      memberImage: r.member.image,
      period: r.contribution.period,
      periodLabel: periodLabel(r.contribution.period),
      expectedAmount: r.contribution.expectedAmount,
      contributionAmount: r.contribution.contributionAmount,
      penaltyAssessed: r.contribution.penaltyAssessed,
      penaltyPaid: r.contribution.penaltyPaid,
      status: r.contribution.status,
      datePaid: r.contribution.datePaid
        ? r.contribution.datePaid.toISOString()
        : null,
      loanRepayment: rep
        ? {
            originalPrincipal: rep.originalPrincipal,
            principalPaid: String(rep.principalPaid),
            interestPaid: String(rep.interestPaid),
            remainingBalanceAfter: rep.remainingBalanceAfter,
          }
        : null,
      createdAt: r.contribution.createdAt.toISOString(),
    };
  });

  return {
    items,
    nextCursor:
      hasMore && last
        ? `${last.contribution.period}|${last.contribution.createdAt.getTime()}|${last.contribution.id}`
        : null,
  };
}

// ─── Router ────────────────────────────────────────────────────────────────

export const contributionRouter = router({
  /**
   * Everything the recording screen needs for one kosh + period: the kosh's
   * period config, each active member's expected amount and pre-fill values,
   * and active-loan info. Pass `period` to inspect a specific period; when
   * omitted the server resolves the default period for today.
   */
  periodData: protectedProcedure
    .input(
      z.object({
        koshId: koshIdSchema,
        period: periodSchema.optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { koshRow } = await requireAdhyaksh(
        input.koshId,
        ctx.session.user.id,
      );

      const period = input.period ?? defaultPeriodFor(koshRow.dueDay);
      const periodConfig = await resolvePeriodConfig(
        koshRow.id,
        period,
        koshRow,
      );
      const dueDate = dueDateFor(period, periodConfig.dueDay);
      const overdueDays = daysBetween(dueDate);
      const isPastDue = overdueDays > 0;
      const isPenaltyDue = isPenaltyDueFor(periodConfig, dueDate);
      const penaltyDueDate =
        periodConfig.applyPenalty && periodConfig.latePenaltyAmount != null
          ? toDateString(
              new Date(
                dueDate.getTime() + penaltyGraceDaysFor(periodConfig) * DAY_MS,
              ),
            )
          : null;

      const [memberships, existingRows, activeLoans, priorRows, loanRepayments] =
        await Promise.all([
          db.query.koshMembership.findMany({
            where: (m, { and: a, eq: q }) =>
              a(q(m.koshId, input.koshId), q(m.status, "active")),
            with: {
              user: { columns: { id: true, name: true, image: true } },
            },
            columns: { userId: true, role: true },
          }),
          db
            .select()
            .from(contribution)
            .where(
              and(
                eq(contribution.koshId, input.koshId),
                eq(contribution.period, period),
              ),
            ),
          db
            .select({
              id: loan.id,
              borrowerId: loan.borrowerId,
              principal: loan.principal,
              interestRate: loan.interestRate,
              issueDate: loan.issueDate,
              amountRemaining: loan.amountRemaining,
            })
            .from(loan)
            .where(
              and(eq(loan.koshId, input.koshId), eq(loan.status, "active")),
            ),
          db
            .select()
            .from(contribution)
            .where(
              and(
                eq(contribution.koshId, input.koshId),
                lt(contribution.period, period),
              ),
            ),
          db
            .select({
              loanId: loanRepayment.loanId,
              interestPortion: loanRepayment.interestPortion,
            })
            .from(loanRepayment),
        ]);

      const rowByMember = new Map(existingRows.map((r) => [r.memberId, r]));
      const loanByMember = new Map(
        activeLoans.filter((l) => l.borrowerId).map((l) => [l.borrowerId, l]),
      );

      const paidInterestByLoan = new Map<string, number>();
      for (const r of loanRepayments) {
        if (!r.loanId) continue;
        const current = paidInterestByLoan.get(r.loanId) ?? 0;
        paidInterestByLoan.set(
          r.loanId,
          current + parseFloat(r.interestPortion ?? "0"),
        );
      }

      // Carried-over arrears from periods before the one being viewed: how much
      // contribution and penalty the member still owes from earlier cycles.
      // Kept as two distinct amounts so arrears stay auditable.
      const priorByMember = new Map<
        string,
        { contribution: number; penalty: number }
      >();
      for (const r of priorRows) {
        const owed = priorByMember.get(r.memberId) ?? {
          contribution: 0,
          penalty: 0,
        };
        owed.contribution += round2(
          Math.max(
            0,
            parseFloat(r.expectedAmount) - parseFloat(r.contributionAmount),
          ),
        );
        owed.penalty += round2(
          Math.max(
            0,
            parseFloat(r.penaltyAssessed) - parseFloat(r.penaltyPaid),
          ),
        );
        priorByMember.set(r.memberId, owed);
      }

      const members = memberships.map((m) => {
        const row = rowByMember.get(m.userId);
        const expected = row
          ? parseFloat(row.expectedAmount)
          : parseFloat(periodConfig.monthlyAmount);
        const paid = row ? parseFloat(row.contributionAmount) : 0;
        const recordedLate =
          overdueDays > LATE_THRESHOLD_DAYS && paid < expected;

        const showPenalty = row ? true : isPenaltyDue;
        const penaltyPrefill = row
          ? row.penaltyAssessed
          : showPenalty
            ? (periodConfig.latePenaltyAmount ?? "0")
            : null;

        const loanRow = loanByMember.get(m.userId);
        const prior = priorByMember.get(m.userId) ?? {
          contribution: 0,
          penalty: 0,
        };

        const maxContributionAllowed = round2(expected + prior.contribution);
        const penaltyAssessedVal = parseFloat(penaltyPrefill ?? "0");
        const maxPenaltyAllowed = round2(penaltyAssessedVal + prior.penalty);

        let activeLoanInfo = null;
        if (loanRow) {
          const principal = parseFloat(loanRow.principal);
          const rate = parseFloat(loanRow.interestRate);
          const remaining = parseFloat(loanRow.amountRemaining);
          const days = Math.max(
            0,
            daysBetween(new Date(`${loanRow.issueDate}T00:00:00`)),
          );
          const accrued = principal * (rate / 100) * (days / 365);
          const paidInterest = paidInterestByLoan.get(loanRow.id) ?? 0;
          const interestOwed = round2(Math.max(0, accrued - paidInterest));
          const totalPayoff = round2(remaining + interestOwed);

          activeLoanInfo = {
            id: loanRow.id,
            remainingPrincipal: String(remaining),
            interestOwed: String(interestOwed),
            totalPayoff: String(totalPayoff),
          };
        }

        return {
          userId: m.userId,
          name: m.user.name,
          image: m.user.image,
          role: m.role,
          expectedAmount: String(expected),
          maxContributionAllowed: String(maxContributionAllowed),
          contributionPrefill: String(expected),
          penaltyPrefill,
          maxPenaltyAllowed: String(maxPenaltyAllowed),
          hasActiveLoan: Boolean(loanRow),
          loanRemaining: loanRow ? loanRow.amountRemaining : null,
          activeLoan: activeLoanInfo,
          recordedLate,
          existing: row
            ? {
                status: row.status,
                contributionAmount: row.contributionAmount,
                penaltyPaid: row.penaltyPaid,
                penaltyAssessed: row.penaltyAssessed,
              }
            : null,
          arrears: {
            contribution: String(prior.contribution),
            penalty: String(prior.penalty),
          },
        };
      });

      return {
        kosh: {
          id: koshRow.id,
          name: koshRow.name,
          currency: koshRow.currency,
          monthlyAmount: periodConfig.monthlyAmount,
          dueDay: periodConfig.dueDay,
          latePenaltyAmount: periodConfig.latePenaltyAmount,
          applyPenalty: periodConfig.applyPenalty,
          penaltyGraceDays: periodConfig.penaltyGraceDays,
        },
        period: {
          value: period,
          label: periodLabel(period),
          dueDate: toDateString(dueDate),
          isPastDue,
          isPenaltyDue,
          penaltyDueDate,
        },
        defaultPeriod: defaultPeriodFor(koshRow.dueDay),
        recordedLateThresholdDays: LATE_THRESHOLD_DAYS,
        members,
      };
    }),

  /** Record one member's contribution (and optional loan repayment). */
  record: protectedProcedure
    .input(
      z
        .object({ koshId: koshIdSchema, period: periodSchema })
        .merge(recordEntrySchema),
    )
    .mutation(async ({ ctx, input }) => {
      const { koshId, period, ...entry } = input;
      const { results } = await runBulk(
        koshId,
        period,
        [entry],
        ctx.session.user.id,
      );
      return results[0];
    }),

  /**
   * Record many members in one call (bulk submit / "mark all as fully paid").
   * Each member goes through the same independent two-write logic; failures
   * are reported per-member and never abort the rest of the batch.
   */
  recordBulk: protectedProcedure
    .input(
      z.object({
        koshId: koshIdSchema,
        period: periodSchema,
        entries: z.array(recordEntrySchema).min(1).max(200),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return runBulk(
        input.koshId,
        input.period,
        input.entries,
        ctx.session.user.id,
      );
    }),

  /**
   * All contributions for the current user across their active koshes
   * (optionally filtered by a single koshId).
   */
  myContributions: protectedProcedure
    .input(
      z
        .object({
          koshId: koshIdSchema.optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const userMemberships = await db.query.koshMembership.findMany({
        where: (m, { and: a, eq: q }) =>
          a(q(m.userId, userId), q(m.status, "active")),
        with: {
          kosh: {
            columns: {
              id: true,
              name: true,
              iconUrl: true,
              monthlyAmount: true,
              currency: true,
              dueDay: true,
            },
          },
        },
      });

      const koshes = userMemberships.map((m) => m.kosh);
      const koshIds = input?.koshId ? [input.koshId] : koshes.map((k) => k.id);

      if (koshIds.length === 0) {
        return {
          koshes: [],
          stats: {
            totalPaid: "0",
            totalPenaltiesPaid: "0",
            unpaidDues: "0",
            paidPeriodsCount: 0,
            pendingPeriodsCount: 0,
            latePeriodsCount: 0,
          },
          items: [],
        };
      }

      const records = await db.query.contribution.findMany({
        where: (c, { and: a, eq: q, inArray: inArr }) =>
          a(q(c.memberId, userId), inArr(c.koshId, koshIds)),
        with: {
          kosh: {
            columns: { id: true, name: true, iconUrl: true, currency: true },
          },
        },
        orderBy: (c, { desc: d }) => [d(c.period)],
      });

      let totalPaid = 0;
      let totalPenaltiesPaid = 0;
      let unpaidDues = 0;
      let paidPeriodsCount = 0;
      let pendingPeriodsCount = 0;
      let latePeriodsCount = 0;

      const items = records.map((r) => {
        const cAmount = parseFloat(r.contributionAmount ?? "0");
        const pPaid = parseFloat(r.penaltyPaid ?? "0");
        const pAssessed = parseFloat(r.penaltyAssessed ?? "0");
        const expected = parseFloat(r.expectedAmount ?? "0");

        totalPaid += cAmount;
        totalPenaltiesPaid += pPaid;

        if (r.status === "paid") {
          paidPeriodsCount++;
        } else if (r.status === "late") {
          paidPeriodsCount++;
          latePeriodsCount++;
        } else {
          pendingPeriodsCount++;
          if (r.status === "partial") {
            unpaidDues += Math.max(0, expected - cAmount);
          } else {
            unpaidDues += expected;
          }
        }

        unpaidDues += Math.max(0, pAssessed - pPaid);

        return {
          id: r.id,
          koshId: r.koshId,
          koshName: r.kosh.name,
          koshIconUrl: r.kosh.iconUrl,
          period: r.period,
          periodLabel: periodLabel(r.period),
          expectedAmount: r.expectedAmount,
          contributionAmount: r.contributionAmount,
          penaltyAssessed: r.penaltyAssessed,
          penaltyPaid: r.penaltyPaid,
          status: r.status,
          datePaid: r.datePaid ? r.datePaid.toISOString() : null,
        };
      });

      return {
        koshes,
        stats: {
          totalPaid: String(totalPaid),
          totalPenaltiesPaid: String(totalPenaltiesPaid),
          unpaidDues: String(unpaidDues),
          paidPeriodsCount,
          pendingPeriodsCount,
          latePeriodsCount,
        },
        items,
      };
    }),

  /**
   * Dedicated queries for contributions with filter support (member, date range)
   */
  allContributionsByKosh: protectedProcedure
    .input(
      z.object({
        koshId: koshIdSchema,
        limit: z.number().int().min(1).max(50).default(20),
        cursor: z.string().nullable().optional(),
        memberId: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return queryContributionsByKosh({
        ...input,
        userId: ctx.session.user.id,
        statusGroup: "all",
      });
    }),

  paidContributionsByKosh: protectedProcedure
    .input(
      z.object({
        koshId: koshIdSchema,
        limit: z.number().int().min(1).max(50).default(20),
        cursor: z.string().nullable().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return queryContributionsByKosh({
        ...input,
        userId: ctx.session.user.id,
        statusGroup: "paid",
      });
    }),

  pendingContributionsByKosh: protectedProcedure
    .input(
      z.object({
        koshId: koshIdSchema,
        limit: z.number().int().min(1).max(50).default(20),
        cursor: z.string().nullable().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return queryContributionsByKosh({
        ...input,
        userId: ctx.session.user.id,
        statusGroup: "pending",
      });
    }),

  lateContributionsByKosh: protectedProcedure
    .input(
      z.object({
        koshId: koshIdSchema,
        limit: z.number().int().min(1).max(50).default(20),
        cursor: z.string().nullable().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return queryContributionsByKosh({
        ...input,
        userId: ctx.session.user.id,
        statusGroup: "late",
      });
    }),

  /**
   * Legacy/fallback infinite query for contribution history of a specific kosh.
   */
  historyByKosh: protectedProcedure
    .input(
      z.object({
        koshId: koshIdSchema,
        limit: z.number().int().min(1).max(50).default(20),
        cursor: z.string().nullable().optional(),
        status: z
          .enum(["all", "paid", "pending", "late", "partial"])
          .optional()
          .default("all"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const statusGroup =
        input.status === "paid"
          ? "paid"
          : input.status === "pending" || input.status === "partial"
            ? "pending"
            : input.status === "late"
              ? "late"
              : "all";
      return queryContributionsByKosh({
        koshId: input.koshId,
        limit: input.limit,
        cursor: input.cursor,
        userId: ctx.session.user.id,
        statusGroup,
      });
    }),
});

export type ContributionMemberData = {
  userId: string;
  name: string | null;
  image: string | null;
  role: string;
  expectedAmount: string;
  maxContributionAllowed: string;
  contributionPrefill: string;
  penaltyPrefill: string | null;
  maxPenaltyAllowed: string;
  hasActiveLoan: boolean;
  loanRemaining: string | null;
  activeLoan: {
    id: string;
    remainingPrincipal: string;
    interestOwed: string;
    totalPayoff: string;
  } | null;
  recordedLate: boolean;
  existing: {
    status: string;
    contributionAmount: string;
    penaltyPaid: string;
    penaltyAssessed: string;
  } | null;
  arrears: {
    contribution: string;
    penalty: string;
  };
};

export type ContributionPeriodData = {
  kosh: {
    id: string;
    name: string;
    currency: string;
    monthlyAmount: string;
    dueDay: number;
    latePenaltyAmount: string | null;
    applyPenalty: boolean;
    penaltyGraceDays: number | null;
  };
  period: {
    value: string;
    label: string;
    dueDate: string;
    isPastDue: boolean;
    isPenaltyDue: boolean;
    penaltyDueDate: string | null;
  };
  defaultPeriod: string;
  recordedLateThresholdDays: number;
  members: ContributionMemberData[];
};

export type RecordEntryResult = {
  memberId: string;
  ok: boolean;
  error?: string;
  contribution?: {
    id: string;
    status: string;
    contributionAmount: string;
    penaltyAssessed: string;
    penaltyPaid: string;
  };
  repayment?: {
    id: string;
    principalPortion: string;
    interestPortion: string;
    remainingBalanceAfter: string;
  } | null;
};

export type MyContributionsData = {
  koshes: {
    id: string;
    name: string;
    iconUrl: string | null;
    monthlyAmount: string;
    currency: string;
    dueDay: number;
  }[];
  stats: {
    totalPaid: string;
    totalPenaltiesPaid: string;
    unpaidDues: string;
    paidPeriodsCount: number;
    pendingPeriodsCount: number;
    latePeriodsCount: number;
  };
  items: {
    id: string;
    koshId: string;
    koshName: string;
    koshIconUrl: string | null;
    period: string;
    periodLabel: string;
    expectedAmount: string;
    contributionAmount: string;
    penaltyAssessed: string;
    penaltyPaid: string;
    status: "pending" | "paid" | "partial" | "late";
    datePaid: string | null;
  }[];
};

export type MyContributionItem = MyContributionsData["items"][number];
export type MyContributionStats = MyContributionsData["stats"];
export type ContributionStatusFilter = "all" | "paid" | "pending" | "late";

export type KoshContributionHistoryItem = {
  id: string;
  koshId: string;
  memberId: string;
  memberName: string | null;
  memberImage: string | null;
  period: string;
  periodLabel: string;
  expectedAmount: string;
  contributionAmount: string;
  penaltyAssessed: string;
  penaltyPaid: string;
  status: "pending" | "paid" | "partial" | "late";
  datePaid: string | null;
  loanRepayment: {
    originalPrincipal: string;
    principalPaid: string;
    interestPaid: string;
    remainingBalanceAfter: string;
  } | null;
  createdAt: string;
};
