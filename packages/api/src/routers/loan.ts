import { db } from "@kosh-app/db";
import { user } from "@kosh-app/db/schema/auth";
import {
  loan,
  loanRepayment,
  loanRequest,
  nonMemberBorrower,
} from "@kosh-app/db/schema/loans";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, inArray, lt, lte, or, sql } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

const myLoansSchema = z
  .object({
    koshId: z.uuid().optional(),
    status: z.enum(["all", "active", "pending", "cleared"]).default("all"),
  })
  .optional();

// ─── Shared pagination & filter helpers ────────────────────────────────────

const PENDING_REQUEST_STATUSES = [
  "pending_adhyaksh",
  "pending_koshadhyaksh",
] as const;

const CLEARED_LOAN_STATUSES = ["paid_off", "defaulted"] as const;

const koshLoansPaginationSchema = z.object({
  koshId: z.string().uuid(),
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.string().nullable().optional(),
});

const allLoansByKoshSchema = koshLoansPaginationSchema.extend({
  status: z.enum(["all", "active", "pending", "cleared"]).default("all"),
  memberId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

const isUuid = (val: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    val,
  );

async function getUserKoshMembership(userId: string, koshId: string) {
  const membership = await db.query.koshMembership.findFirst({
    where: (m, { and: a, eq: q }) =>
      a(
        q(m.koshId, koshId),
        q(m.userId, userId),
        q(m.status, "active"),
      ),
    with: {
      kosh: true,
    },
  });

  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not an active member of this kosh",
    });
  }

  return membership;
}

async function getKoshMemberOptions(koshId: string) {
  const activeMemberships = await db.query.koshMembership.findMany({
    where: (m, { and: a, eq: q }) =>
      a(q(m.koshId, koshId), q(m.status, "active")),
    with: {
      user: {
        columns: { id: true, name: true, image: true, email: true },
      },
    },
  });

  const nonMembers = await db.query.nonMemberBorrower.findMany({
    where: (nm, { eq: q }) => q(nm.koshId, koshId),
  });

  return [
    { id: "all", label: "All Members" },
    ...activeMemberships.map((m) => ({
      id: m.user.id,
      label: m.user.name,
      image: m.user.image,
      isNonMember: false,
    })),
    ...nonMembers.map((nm) => ({
      id: nm.id,
      label: `${nm.name} (Non-member)`,
      image: null,
      isNonMember: true,
    })),
  ];
}

/** Keyset cursor shape: `${createdAt.getTime()}|${id}`. */
function encodeCursor(createdAt: Date, id: string) {
  return `${createdAt.getTime()}|${id}`;
}

function decodeCursor(cursor: string | null | undefined) {
  if (!cursor) return null;
  const [timestamp, id] = cursor.split("|", 2);
  const time = Number(timestamp);
  if (!id || Number.isNaN(time)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid pagination cursor",
    });
  }
  return { time, id };
}

/** Cursor slots for the combined pending + loans feed. */
type LoanFeedSlot = "start" | "done" | { time: number; id: string };

function parseLoanFeedCursor(
  cursor: string | null | undefined,
): { pending: LoanFeedSlot; loans: LoanFeedSlot } {
  if (!cursor) return { pending: "start", loans: "start" };
  const [pendingRaw, loansRaw] = cursor.split(";");
  const parseSlot = (raw: string | undefined): LoanFeedSlot => {
    if (!raw || raw === "done") return "done";
    return decodeCursor(raw) ?? "done";
  };
  return { pending: parseSlot(pendingRaw), loans: parseSlot(loansRaw) };
}

const slotToCursor = (slot: LoanFeedSlot) =>
  slot === "start" || slot === "done" ? null : `${slot.time}|${slot.id}`;

const EMPTY_PAGE = { items: [] as any[], nextCursor: null as string | null };

async function fetchLoansPage(params: {
  koshId: string;
  limit: number;
  cursor: string | null | undefined;
  statuses?: readonly ("active" | "paid_off" | "defaulted")[];
  memberId?: string | null;
  dateFrom?: string;
  dateTo?: string;
}) {
  const conditions = [eq(loan.koshId, params.koshId)];

  if (params.statuses && params.statuses.length > 0) {
    conditions.push(inArray(loan.status, params.statuses));
  }

  if (params.memberId) {
    if (isUuid(params.memberId)) {
      conditions.push(
        or(
          eq(loan.borrowerId, params.memberId),
          eq(loan.nonMemberBorrowerId, params.memberId),
        )!,
      );
    } else {
      conditions.push(eq(loan.borrowerId, params.memberId));
    }
  }

  if (params.dateFrom) {
    conditions.push(gte(loan.issueDate, params.dateFrom));
  }
  if (params.dateTo) {
    conditions.push(lte(loan.issueDate, params.dateTo));
  }

  const cursor = decodeCursor(params.cursor);
  if (cursor) {
    const cursorTime = new Date(cursor.time);
    conditions.push(
      or(
        lt(loan.createdAt, cursorTime),
        and(eq(loan.createdAt, cursorTime), lt(loan.id, cursor.id)),
      )!,
    );
  }

  const rows = await db
    .select({
      id: loan.id,
      koshId: loan.koshId,
      borrowerId: loan.borrowerId,
      nonMemberBorrowerId: loan.nonMemberBorrowerId,
      borrowerName: sql<string>`coalesce(${user.name}, ${nonMemberBorrower.name}, 'Unknown')`,
      borrowerImage: user.image,
      principal: loan.principal,
      interestRate: loan.interestRate,
      issueDate: loan.issueDate,
      dueDate: loan.dueDate,
      status: loan.status,
      amountRemaining: loan.amountRemaining,
      createdAt: loan.createdAt,
      totalRepaid: sql<string>`coalesce((
        select sum(${loanRepayment.principalPortion} + ${loanRepayment.interestPortion})
        from ${loanRepayment}
        where ${loanRepayment.loanId} = ${loan.id}
      ), 0)`,
      totalInterestPaid: sql<string>`coalesce((
        select sum(${loanRepayment.interestPortion})
        from ${loanRepayment}
        where ${loanRepayment.loanId} = ${loan.id}
      ), 0)`,
    })
    .from(loan)
    .leftJoin(user, eq(loan.borrowerId, user.id))
    .leftJoin(
      nonMemberBorrower,
      eq(loan.nonMemberBorrowerId, nonMemberBorrower.id),
    )
    .where(and(...conditions))
    .orderBy(desc(loan.createdAt), desc(loan.id))
    .limit(params.limit + 1);

  const page = rows.slice(0, params.limit);
  const last = page[page.length - 1];

  return {
    items: page.map(toLoanItem),
    nextCursor:
      rows.length > params.limit && last
        ? encodeCursor(last.createdAt, last.id)
        : null,
  };
}

async function fetchPendingRequestsPage(params: {
  koshId: string;
  limit: number;
  cursor: string | null | undefined;
  memberId?: string | null;
  dateFrom?: string;
  dateTo?: string;
}) {
  const conditions = [
    eq(loanRequest.koshId, params.koshId),
    inArray(loanRequest.status, PENDING_REQUEST_STATUSES),
  ];

  if (params.memberId) {
    if (isUuid(params.memberId)) {
      conditions.push(
        or(
          eq(loanRequest.requestedBy, params.memberId),
          eq(loanRequest.nonMemberBorrowerId, params.memberId),
        )!,
      );
    } else {
      conditions.push(eq(loanRequest.requestedBy, params.memberId));
    }
  }

  if (params.dateFrom) {
    conditions.push(
      gte(loanRequest.createdAt, new Date(`${params.dateFrom}T00:00:00`)),
    );
  }
  if (params.dateTo) {
    conditions.push(
      lte(loanRequest.createdAt, new Date(`${params.dateTo}T23:59:59`)),
    );
  }

  const cursor = decodeCursor(params.cursor);
  if (cursor) {
    const cursorTime = new Date(cursor.time);
    conditions.push(
      or(
        lt(loanRequest.createdAt, cursorTime),
        and(
          eq(loanRequest.createdAt, cursorTime),
          lt(loanRequest.id, cursor.id),
        ),
      )!,
    );
  }

  const rows = await db
    .select({
      id: loanRequest.id,
      koshId: loanRequest.koshId,
      requestedBy: loanRequest.requestedBy,
      nonMemberBorrowerId: loanRequest.nonMemberBorrowerId,
      borrowerName: sql<string>`coalesce(${user.name}, ${nonMemberBorrower.name}, 'Unknown')`,
      borrowerImage: user.image,
      amountRequested: loanRequest.amountRequested,
      note: loanRequest.note,
      status: loanRequest.status,
      createdAt: loanRequest.createdAt,
    })
    .from(loanRequest)
    .leftJoin(user, eq(loanRequest.requestedBy, user.id))
    .leftJoin(
      nonMemberBorrower,
      eq(loanRequest.nonMemberBorrowerId, nonMemberBorrower.id),
    )
    .where(and(...conditions))
    .orderBy(desc(loanRequest.createdAt), desc(loanRequest.id))
    .limit(params.limit + 1);

  const page = rows.slice(0, params.limit);
  const last = page[page.length - 1];

  return {
    items: page.map(toPendingRequestItem),
    nextCursor:
      rows.length > params.limit && last
        ? encodeCursor(last.createdAt, last.id)
        : null,
  };
}

// ─── Unified item mapping ───────────────────────────────────────────────────

function toLoanItem(l: {
  id: string;
  koshId: string;
  borrowerId: string | null;
  nonMemberBorrowerId: string | null;
  borrowerName: string;
  borrowerImage: string | null;
  principal: string;
  interestRate: string;
  issueDate: string;
  dueDate: string | null;
  status: "active" | "paid_off" | "defaulted";
  amountRemaining: string;
  createdAt: Date;
  totalRepaid: string;
  totalInterestPaid: string;
}): KoshLoanItem {
  const principal = parseFloat(l.principal);
  const monthlyRate = parseFloat(l.interestRate);
  const yearlyRate = monthlyRate * 12;
  const monthlyInterestAmount =
    Math.round(principal * (monthlyRate / 100) * 100) / 100;

  return {
    id: l.id,
    koshId: l.koshId,
    borrowerId: l.borrowerId ?? l.nonMemberBorrowerId,
    borrowerName: l.borrowerName,
    borrowerAvatar: l.borrowerImage,
    isNonMember: !l.borrowerId,
    status: l.status,
    createdAt: l.createdAt.toISOString(),
    principal: l.principal,
    interestRate: l.interestRate,
    monthlyInterestRate: String(monthlyRate),
    yearlyInterestRate: String(yearlyRate),
    monthlyInterestAmount: String(monthlyInterestAmount),
    issueDate: l.issueDate,
    dueDate: l.dueDate,
    amountRemaining: l.amountRemaining,
    totalRepaid: l.totalRepaid,
    totalInterestPaid: l.totalInterestPaid,
    amountRequested: null,
    note: null,
  };
}

function toPendingRequestItem(r: {
  id: string;
  koshId: string;
  requestedBy: string | null;
  nonMemberBorrowerId: string | null;
  borrowerName: string;
  borrowerImage: string | null;
  amountRequested: string;
  note: string | null;
  status: "pending_adhyaksh" | "pending_koshadhyaksh" | "approved" | "rejected";
  createdAt: Date;
}): KoshLoanItem {
  return {
    id: r.id,
    koshId: r.koshId,
    borrowerId: r.requestedBy ?? r.nonMemberBorrowerId,
    borrowerName: r.borrowerName,
    borrowerAvatar: r.borrowerImage,
    isNonMember: !r.requestedBy,
    status: r.status as KoshLoanItem["status"],
    createdAt: r.createdAt.toISOString(),
    principal: null,
    interestRate: null,
    monthlyInterestRate: null,
    yearlyInterestRate: null,
    monthlyInterestAmount: null,
    issueDate: null,
    dueDate: null,
    amountRemaining: null,
    totalRepaid: null,
    totalInterestPaid: null,
    amountRequested: r.amountRequested,
    note: r.note,
  };
}

export const loanRouter = router({
  /**
   * All loans where the current user is the borrower, across all their koshes
   * (or filtered to a single kosh).
   */
  myLoans: protectedProcedure
    .input(myLoansSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Koshes where the user is an active member.
      const memberships = await db.query.koshMembership.findMany({
        where: (m, { and: a, eq: q }) =>
          a(q(m.userId, userId), q(m.status, "active")),
        columns: { koshId: true },
        with: {
          kosh: {
            columns: {
              id: true,
              name: true,
              iconUrl: true,
              currency: true,
              memberInterestRate: true,
            },
          },
        },
      });

      const koshMap = new Map(memberships.map((m) => [m.koshId, m.kosh]));
      let koshIds = memberships.map((m) => m.koshId);

      if (input?.koshId) {
        if (!koshMap.has(input.koshId)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not a member of this kosh",
          });
        }
        koshIds = [input.koshId];
      }

      if (koshIds.length === 0) {
        return {
          koshes: [],
          stats: {
            activeLoanCount: 0,
            totalBorrowed: "0",
            totalRemaining: "0",
            totalRepaid: "0",
            totalInterestPaid: "0",
          },
          items: [],
        };
      }

      const statusInput = input?.status ?? "all";
      const fetchLoans =
        statusInput === "all" ||
        statusInput === "active" ||
        statusInput === "cleared";
      const fetchPending =
        statusInput === "all" || statusInput === "pending";

      let loansList: MyLoanItem[] = [];
      if (fetchLoans) {
        const loanStatuses =
          statusInput === "active"
            ? (["active"] as const)
            : statusInput === "cleared"
              ? CLEARED_LOAN_STATUSES
              : (["active", "paid_off", "defaulted"] as const);

        const rawLoans = await db
          .select({
            id: loan.id,
            koshId: loan.koshId,
            principal: loan.principal,
            interestRate: loan.interestRate,
            issueDate: loan.issueDate,
            dueDate: loan.dueDate,
            status: loan.status,
            amountRemaining: loan.amountRemaining,
            createdAt: loan.createdAt,
            totalRepaid: sql<string>`coalesce((
              select sum(${loanRepayment.principalPortion} + ${loanRepayment.interestPortion})
              from ${loanRepayment}
              where ${loanRepayment.loanId} = ${loan.id}
            ), 0)`,
            totalInterestPaid: sql<string>`coalesce((
              select sum(${loanRepayment.interestPortion})
              from ${loanRepayment}
              where ${loanRepayment.loanId} = ${loan.id}
            ), 0)`,
          })
          .from(loan)
          .where(
            and(
              eq(loan.borrowerId, userId),
              inArray(loan.koshId, koshIds),
              inArray(loan.status, loanStatuses),
            ),
          )
          .orderBy(desc(loan.createdAt));

        loansList = rawLoans.map((l) => {
          const principal = parseFloat(l.principal);
          const koshInfo = koshMap.get(l.koshId)!;
          const monthlyRate = parseFloat(l.interestRate);
          const yearlyRate = monthlyRate * 12;
          const monthlyInterestAmount =
            Math.round(principal * (monthlyRate / 100) * 100) / 100;

          return {
            id: l.id,
            koshId: l.koshId,
            koshName: koshInfo.name,
            koshIconUrl: koshInfo.iconUrl,
            currency: koshInfo.currency,
            principal: l.principal,
            interestRate: l.interestRate,
            monthlyInterestRate: String(monthlyRate),
            yearlyInterestRate: String(yearlyRate),
            monthlyInterestAmount: String(monthlyInterestAmount),
            issueDate: l.issueDate,
            dueDate: l.dueDate,
            status: l.status,
            amountRemaining: l.amountRemaining,
            totalRepaid: l.totalRepaid,
            totalInterestPaid: l.totalInterestPaid,
            createdAt: l.createdAt.toISOString(),
            amountRequested: null,
            note: null,
          };
        });
      }

      let pendingList: MyLoanItem[] = [];
      if (fetchPending) {
        const rawRequests = await db
          .select({
            id: loanRequest.id,
            koshId: loanRequest.koshId,
            amountRequested: loanRequest.amountRequested,
            note: loanRequest.note,
            status: loanRequest.status,
            createdAt: loanRequest.createdAt,
          })
          .from(loanRequest)
          .where(
            and(
              eq(loanRequest.requestedBy, userId),
              inArray(loanRequest.koshId, koshIds),
              inArray(loanRequest.status, PENDING_REQUEST_STATUSES),
            ),
          )
          .orderBy(desc(loanRequest.createdAt));

        pendingList = rawRequests.map((r) => {
          const koshInfo = koshMap.get(r.koshId)!;
          const createdIso = r.createdAt.toISOString();
          return {
            id: r.id,
            koshId: r.koshId,
            koshName: koshInfo.name,
            koshIconUrl: koshInfo.iconUrl,
            currency: koshInfo.currency,
            principal: r.amountRequested,
            interestRate: "0",
            monthlyInterestRate: "0",
            yearlyInterestRate: "0",
            monthlyInterestAmount: "0",
            issueDate: createdIso.split("T")[0] || "",
            dueDate: null,
            status: r.status as "pending_adhyaksh" | "pending_koshadhyaksh",
            amountRemaining: r.amountRequested,
            totalRepaid: "0",
            totalInterestPaid: "0",
            createdAt: createdIso,
            amountRequested: r.amountRequested,
            note: r.note,
          };
        });
      }

      const allItems = [...pendingList, ...loansList].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      // Aggregate stats across all user loans & requests
      const activeLoans = loansList.filter((l) => l.status === "active");

      let totalBorrowed = 0;
      let totalRemaining = 0;
      let totalRepaid = 0;
      let totalInterestPaid = 0;

      for (const l of loansList) {
        totalBorrowed += parseFloat(l.principal);
        totalRepaid += parseFloat(l.totalRepaid);
        totalInterestPaid += parseFloat(l.totalInterestPaid);
        if (l.status === "active") {
          totalRemaining += parseFloat(l.amountRemaining);
        }
      }

      const koshes = memberships.map((m) => ({
        id: m.kosh.id,
        name: m.kosh.name,
        iconUrl: m.kosh.iconUrl,
        currency: m.kosh.currency,
      }));

      return {
        koshes,
        stats: {
          activeLoanCount: activeLoans.length,
          totalBorrowed: String(totalBorrowed),
          totalRemaining: String(totalRemaining),
          totalRepaid: String(totalRepaid),
          totalInterestPaid: String(totalInterestPaid),
        },
        items: allItems,
      };
    }),

  /**
   * Aggregate loan statistics for the current user across all active Koshes
   * (or filtered to a single Kosh).
   */
  myStats: protectedProcedure
    .input(
      z
        .object({
          koshId: z.string().uuid().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const memberships = await db.query.koshMembership.findMany({
        where: (m, { and: a, eq: q }) =>
          a(q(m.userId, userId), q(m.status, "active")),
        columns: { koshId: true },
      });

      let koshIds = memberships.map((m) => m.koshId);
      if (input?.koshId) {
        if (!koshIds.includes(input.koshId)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not an active member of this kosh",
          });
        }
        koshIds = [input.koshId];
      }

      if (koshIds.length === 0) {
        return {
          activeLoanCount: 0,
          totalBorrowed: "0",
          totalRemaining: "0",
          totalRepaid: "0",
          totalInterestPaid: "0",
        };
      }

      const loans = await db
        .select({
          principal: loan.principal,
          amountRemaining: loan.amountRemaining,
          status: loan.status,
          totalRepaid: sql<string>`coalesce((
            select sum(${loanRepayment.principalPortion} + ${loanRepayment.interestPortion})
            from ${loanRepayment}
            where ${loanRepayment.loanId} = ${loan.id}
          ), 0)`,
          totalInterestPaid: sql<string>`coalesce((
            select sum(${loanRepayment.interestPortion})
            from ${loanRepayment}
            where ${loanRepayment.loanId} = ${loan.id}
          ), 0)`,
        })
        .from(loan)
        .where(
          and(eq(loan.borrowerId, userId), inArray(loan.koshId, koshIds)),
        );

      let activeLoanCount = 0;
      let totalBorrowed = 0;
      let totalRemaining = 0;
      let totalRepaid = 0;
      let totalInterestPaid = 0;

      for (const l of loans) {
        const principal = parseFloat(l.principal);
        const remaining = parseFloat(l.amountRemaining);
        const repaid = parseFloat(l.totalRepaid);
        const interestPaid = parseFloat(l.totalInterestPaid);

        totalBorrowed += principal;
        totalRepaid += repaid;
        totalInterestPaid += interestPaid;

        if (l.status === "active") {
          activeLoanCount++;
          totalRemaining += remaining;
        }
      }

      return {
        activeLoanCount,
        totalBorrowed: String(totalBorrowed),
        totalRemaining: String(totalRemaining),
        totalRepaid: String(totalRepaid),
        totalInterestPaid: String(totalInterestPaid),
      };
    }),

  /**
   * Infinite feed of user's personal loans and requests across their koshes
   * (or filtered by single koshId).
   */
  myLoansFeed: protectedProcedure
    .input(
      z.object({
        koshId: z.string().uuid().optional(),
        status: z.enum(["all", "active", "pending", "cleared"]).default("all"),
        limit: z.number().int().min(1).max(50).default(20),
        cursor: z.string().nullable().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const memberships = await db.query.koshMembership.findMany({
        where: (m, { and: a, eq: q }) =>
          a(q(m.userId, userId), q(m.status, "active")),
        columns: { koshId: true },
        with: {
          kosh: {
            columns: {
              id: true,
              name: true,
              iconUrl: true,
              currency: true,
            },
          },
        },
      });

      const koshMap = new Map(memberships.map((m) => [m.koshId, m.kosh]));
      let koshIds = memberships.map((m) => m.koshId);

      if (input.koshId) {
        if (!koshMap.has(input.koshId)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not an active member of this kosh",
          });
        }
        koshIds = [input.koshId];
      }

      if (koshIds.length === 0) {
        return {
          items: [],
          nextCursor: null,
        };
      }

      const status = input.status;
      const limit = input.limit;
      const fetchLoans =
        status === "all" || status === "active" || status === "cleared";
      const fetchPending = status === "all" || status === "pending";

      const loanStatuses =
        status === "active"
          ? (["active"] as const)
          : status === "cleared"
            ? CLEARED_LOAN_STATUSES
            : (["active", "paid_off", "defaulted"] as const);

      const slots = parseLoanFeedCursor(input.cursor);

      let pendingPage = EMPTY_PAGE;
      if (fetchPending && slots.pending !== "done") {
        const pConditions = [
          eq(loanRequest.requestedBy, userId),
          inArray(loanRequest.koshId, koshIds),
          inArray(loanRequest.status, PENDING_REQUEST_STATUSES),
        ];

        const pCursor = decodeCursor(slotToCursor(slots.pending));
        if (pCursor) {
          const cTime = new Date(pCursor.time);
          pConditions.push(
            or(
              lt(loanRequest.createdAt, cTime),
              and(
                eq(loanRequest.createdAt, cTime),
                lt(loanRequest.id, pCursor.id),
              ),
            )!,
          );
        }

        const rawReqs = await db
          .select({
            id: loanRequest.id,
            koshId: loanRequest.koshId,
            amountRequested: loanRequest.amountRequested,
            note: loanRequest.note,
            status: loanRequest.status,
            createdAt: loanRequest.createdAt,
          })
          .from(loanRequest)
          .where(and(...pConditions))
          .orderBy(desc(loanRequest.createdAt), desc(loanRequest.id))
          .limit(limit + 1);

        const pSlice = rawReqs.slice(0, limit);
        const pLast = pSlice[pSlice.length - 1];

        const mappedItems: MyLoanItem[] = pSlice.map((r) => {
          const koshInfo = koshMap.get(r.koshId)!;
          const createdIso = r.createdAt.toISOString();
          return {
            id: r.id,
            koshId: r.koshId,
            koshName: koshInfo.name,
            koshIconUrl: koshInfo.iconUrl,
            currency: koshInfo.currency,
            principal: r.amountRequested,
            interestRate: "0",
            monthlyInterestRate: "0",
            yearlyInterestRate: "0",
            monthlyInterestAmount: "0",
            issueDate: createdIso.split("T")[0] || "",
            dueDate: null,
            status: r.status as "pending_adhyaksh" | "pending_koshadhyaksh",
            amountRemaining: r.amountRequested,
            totalRepaid: "0",
            totalInterestPaid: "0",
            createdAt: createdIso,
            amountRequested: r.amountRequested,
            note: r.note,
          };
        });

        pendingPage = {
          items: mappedItems,
          nextCursor:
            rawReqs.length > limit && pLast
              ? encodeCursor(pLast.createdAt, pLast.id)
              : null,
        };
      }

      let loansPage = EMPTY_PAGE;
      if (fetchLoans && slots.loans !== "done") {
        const lConditions = [
          eq(loan.borrowerId, userId),
          inArray(loan.koshId, koshIds),
          inArray(loan.status, loanStatuses),
        ];

        const lCursor = decodeCursor(slotToCursor(slots.loans));
        if (lCursor) {
          const cTime = new Date(lCursor.time);
          lConditions.push(
            or(
              lt(loan.createdAt, cTime),
              and(eq(loan.createdAt, cTime), lt(loan.id, lCursor.id)),
            )!,
          );
        }

        const rawLoans = await db
          .select({
            id: loan.id,
            koshId: loan.koshId,
            principal: loan.principal,
            interestRate: loan.interestRate,
            issueDate: loan.issueDate,
            dueDate: loan.dueDate,
            status: loan.status,
            amountRemaining: loan.amountRemaining,
            createdAt: loan.createdAt,
            totalRepaid: sql<string>`coalesce((
              select sum(${loanRepayment.principalPortion} + ${loanRepayment.interestPortion})
              from ${loanRepayment}
              where ${loanRepayment.loanId} = ${loan.id}
            ), 0)`,
            totalInterestPaid: sql<string>`coalesce((
              select sum(${loanRepayment.interestPortion})
              from ${loanRepayment}
              where ${loanRepayment.loanId} = ${loan.id}
            ), 0)`,
          })
          .from(loan)
          .where(and(...lConditions))
          .orderBy(desc(loan.createdAt), desc(loan.id))
          .limit(limit + 1);

        const lSlice = rawLoans.slice(0, limit);
        const lLast = lSlice[lSlice.length - 1];

        const mappedItems: MyLoanItem[] = lSlice.map((l) => {
          const principal = parseFloat(l.principal);
          const koshInfo = koshMap.get(l.koshId)!;
          const monthlyRate = parseFloat(l.interestRate);
          const yearlyRate = monthlyRate * 12;
          const monthlyInterestAmount =
            Math.round(principal * (monthlyRate / 100) * 100) / 100;

          return {
            id: l.id,
            koshId: l.koshId,
            koshName: koshInfo.name,
            koshIconUrl: koshInfo.iconUrl,
            currency: koshInfo.currency,
            principal: l.principal,
            interestRate: l.interestRate,
            monthlyInterestRate: String(monthlyRate),
            yearlyInterestRate: String(yearlyRate),
            monthlyInterestAmount: String(monthlyInterestAmount),
            issueDate: l.issueDate,
            dueDate: l.dueDate,
            status: l.status,
            amountRemaining: l.amountRemaining,
            totalRepaid: l.totalRepaid,
            totalInterestPaid: l.totalInterestPaid,
            createdAt: l.createdAt.toISOString(),
            amountRequested: null,
            note: null,
          };
        });

        loansPage = {
          items: mappedItems,
          nextCursor:
            rawLoans.length > limit && lLast
              ? encodeCursor(lLast.createdAt, lLast.id)
              : null,
        };
      }

      const items = [...pendingPage.items, ...loansPage.items];
      const pendingCursorRaw = fetchPending
        ? pendingPage.nextCursor ?? "done"
        : "done";
      const loansCursorRaw = fetchLoans
        ? loansPage.nextCursor ?? "done"
        : "done";

      const nextCursor =
        pendingCursorRaw === "done" && loansCursorRaw === "done"
          ? null
          : `${pendingCursorRaw};${loansCursorRaw}`;

      return {
        items,
        nextCursor,
      };
    }),

  /**
   * Infinite feed of pending loan requests, active loans, and cleared loans in
   * a kosh, filterable by status, member, and date range. Each page returns a
   * chunk of each status group (pending first, then active, then cleared).
   */
  allLoansByKosh: protectedProcedure
    .input(allLoansByKoshSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const membership = await getUserKoshMembership(userId, input.koshId);
      const memberOptions = await getKoshMemberOptions(input.koshId);

      const selectedMemberId =
        input.memberId && input.memberId !== "all" ? input.memberId : null;

      const status = input.status;
      const limit = input.limit;

      const fetchLoans =
        status === "all" || status === "active" || status === "cleared";
      const fetchPending = status === "all" || status === "pending";

      const loanStatuses: readonly ("active" | "paid_off" | "defaulted")[] =
        status === "active"
          ? (["active"] as const)
          : status === "cleared"
            ? CLEARED_LOAN_STATUSES
            : (["active", "paid_off", "defaulted"] as const);

      const slots = parseLoanFeedCursor(input.cursor);

      const borrowerFilters = {
        memberId: selectedMemberId,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
      };

      const pendingPage =
        fetchPending && slots.pending !== "done"
          ? await fetchPendingRequestsPage({
              koshId: input.koshId,
              limit,
              cursor: slotToCursor(slots.pending),
              ...borrowerFilters,
            })
          : EMPTY_PAGE;

      const loansPage =
        fetchLoans && slots.loans !== "done"
          ? await fetchLoansPage({
              koshId: input.koshId,
              limit,
              cursor: slotToCursor(slots.loans),
              statuses: loanStatuses,
              ...borrowerFilters,
            })
          : EMPTY_PAGE;

      const activeItems = loansPage.items.filter(
        (l) => l.status === "active",
      );
      const clearedItems = loansPage.items.filter(
        (l) => l.status !== "active",
      );

      const items = [
        ...(fetchPending ? pendingPage.items : []),
        ...(fetchLoans ? activeItems : []),
        ...(fetchLoans ? clearedItems : []),
      ];

      const pendingCursorRaw = fetchPending
        ? pendingPage.nextCursor ?? "done"
        : "done";
      const loansCursorRaw = fetchLoans
        ? loansPage.nextCursor ?? "done"
        : "done";
      const nextCursor =
        pendingCursorRaw === "done" && loansCursorRaw === "done"
          ? null
          : `${pendingCursorRaw};${loansCursorRaw}`;

      const totalActiveAmount = activeItems.reduce(
        (acc, l) => acc + parseFloat(l.principal ?? "0"),
        0,
      );
      const totalClearedAmount = clearedItems.reduce(
        (acc, l) => acc + parseFloat(l.principal ?? "0"),
        0,
      );

      return {
        kosh: {
          id: membership.kosh.id,
          name: membership.kosh.name,
          currency: membership.kosh.currency,
        },
        members: memberOptions,
        stats: {
          activeCount: activeItems.length,
          activeAmount: String(totalActiveAmount),
          pendingCount: pendingPage.items.length,
          pendingAmount: pendingPage.items.reduce(
            (acc, r) => acc + parseFloat(r.amountRequested ?? "0"),
            0,
          ),
          clearedCount: clearedItems.length,
          clearedAmount: String(totalClearedAmount),
        },
        items,
        nextCursor,
      };
    }),

  /** Infinite feed of active loans in a kosh. */
  activeLoansByKosh: protectedProcedure
    .input(koshLoansPaginationSchema)
    .query(async ({ ctx, input }) => {
      const membership = await getUserKoshMembership(
        ctx.session.user.id,
        input.koshId,
      );
      const page = await fetchLoansPage({
        koshId: input.koshId,
        limit: input.limit,
        cursor: input.cursor,
        statuses: ["active"],
      });

      return {
        kosh: {
          id: membership.kosh.id,
          name: membership.kosh.name,
          currency: membership.kosh.currency,
        },
        items: page.items,
        nextCursor: page.nextCursor,
      };
    }),

  /** Infinite feed of pending loan requests in a kosh. */
  pendingLoansByKosh: protectedProcedure
    .input(koshLoansPaginationSchema)
    .query(async ({ ctx, input }) => {
      const membership = await getUserKoshMembership(
        ctx.session.user.id,
        input.koshId,
      );
      const page = await fetchPendingRequestsPage({
        koshId: input.koshId,
        limit: input.limit,
        cursor: input.cursor,
      });

      return {
        kosh: {
          id: membership.kosh.id,
          name: membership.kosh.name,
          currency: membership.kosh.currency,
        },
        items: page.items,
        nextCursor: page.nextCursor,
      };
    }),

  /** Infinite feed of cleared (paid off / defaulted) loans in a kosh. */
  paidLoansByKosh: protectedProcedure
    .input(koshLoansPaginationSchema)
    .query(async ({ ctx, input }) => {
      const membership = await getUserKoshMembership(
        ctx.session.user.id,
        input.koshId,
      );
      const page = await fetchLoansPage({
        koshId: input.koshId,
        limit: input.limit,
        cursor: input.cursor,
        statuses: CLEARED_LOAN_STATUSES,
      });

      return {
        kosh: {
          id: membership.kosh.id,
          name: membership.kosh.name,
          currency: membership.kosh.currency,
        },
        items: page.items,
        nextCursor: page.nextCursor,
      };
    }),

  /** Members & non-member borrowers of a kosh by koshId for selection/filtering */
  members: protectedProcedure
    .input(
      z.object({
        koshId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await getUserKoshMembership(ctx.session.user.id, input.koshId);
      return getKoshMemberOptions(input.koshId);
    }),
});

// ─── Exported types ──────────────────────────────────────────────────────────

export type MyLoansData = {
  koshes: {
    id: string;
    name: string;
    iconUrl: string | null;
    currency: string;
  }[];
  stats: {
    activeLoanCount: number;
    totalBorrowed: string;
    totalRemaining: string;
    totalRepaid: string;
    totalInterestPaid: string;
  };
  items: MyLoanItem[];
};

export type MyLoanItem = {
  id: string;
  koshId: string;
  koshName: string;
  koshIconUrl: string | null;
  currency: string;
  principal: string;
  interestRate: string;
  monthlyInterestRate: string;
  yearlyInterestRate: string;
  monthlyInterestAmount: string;
  issueDate: string;
  dueDate: string | null;
  status:
    | "pending_adhyaksh"
    | "pending_koshadhyaksh"
    | "active"
    | "paid_off"
    | "defaulted";
  amountRemaining: string;
  totalRepaid: string;
  totalInterestPaid: string;
  createdAt: string;
  amountRequested?: string | null;
  note?: string | null;
};

/**
 * Unified item for every loan screen in a kosh. A pending loan request only
 * fills the `amountRequested`/`note` fields; an issued loan only fills the
 * principal/interest/repayment fields. Consumers should treat the shape by
 * status instead of a separate `request` vs `loan` union.
 */
export type KoshLoanItem = {
  id: string;
  koshId: string;
  borrowerId: string | null;
  borrowerName: string;
  borrowerAvatar: string | null;
  isNonMember: boolean;
  status:
    | "pending_adhyaksh"
    | "pending_koshadhyaksh"
    | "active"
    | "paid_off"
    | "defaulted";
  createdAt: string;
  principal: string | null;
  interestRate: string | null;
  monthlyInterestRate: string | null;
  yearlyInterestRate: string | null;
  monthlyInterestAmount: string | null;
  issueDate: string | null;
  dueDate: string | null;
  amountRemaining: string | null;
  totalRepaid: string | null;
  totalInterestPaid: string | null;
  amountRequested: string | null;
  note: string | null;
};

export type LoanStatusFilter = "all" | "active" | "pending" | "cleared";
export type KoshLoanTabFilter = "all" | "active" | "pending" | "cleared";
export type LoanStats = {
  activeLoanCount: number;
  totalBorrowed: string;
  totalRemaining: string;
  totalRepaid: string;
  totalInterestPaid: string;
};