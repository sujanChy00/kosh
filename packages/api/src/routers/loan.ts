import { db } from "@kosh-app/db";
import { user } from "@kosh-app/db/schema/auth";
import {
  loan,
  loanRepayment,
  loanRequest,
  nonMemberBorrower,
} from "@kosh-app/db/schema/loans";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, inArray, lte, or, sql } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

const myLoansSchema = z
  .object({
    koshId: z.uuid().optional(),
    status: z.enum(["all", "active", "paid_off", "defaulted"]).default("all"),
  })
  .optional();

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
          },
          items: [],
        };
      }

      const statusFilter =
        input?.status && input.status !== "all"
          ? [input.status]
          : (["active", "paid_off", "defaulted"] as const);

      const loans = await db
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
            inArray(loan.status, statusFilter),
          ),
        )
        .orderBy(desc(loan.createdAt));

      // Aggregate stats across all fetched loans.
      let activeLoanCount = 0;
      let totalBorrowed = 0;
      let totalRemaining = 0;
      let totalRepaid = 0;

      const items = loans.map((l) => {
        const principal = parseFloat(l.principal);
        const remaining = parseFloat(l.amountRemaining);
        const repaid = parseFloat(l.totalRepaid);

        totalBorrowed += principal;
        totalRepaid += repaid;

        if (l.status === "active") {
          activeLoanCount++;
          totalRemaining += remaining;
        }

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
        };
      });

      const koshes = memberships.map((m) => ({
        id: m.kosh.id,
        name: m.kosh.name,
        iconUrl: m.kosh.iconUrl,
        currency: m.kosh.currency,
      }));

      return {
        koshes,
        stats: {
          activeLoanCount,
          totalBorrowed: String(totalBorrowed),
          totalRemaining: String(totalRemaining),
          totalRepaid: String(totalRepaid),
        },
        items,
      };
    }),

  /**
   * All loans and pending requests in a specific kosh with filtering by status, member, and date range.
   */
  byKosh: protectedProcedure
    .input(
      z.object({
        koshId: z.string().uuid(),
        status: z.enum(["all", "active", "pending", "cleared"]).default("all"),
        memberId: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify membership
      const membership = await db.query.koshMembership.findFirst({
        where: (m, { and: a, eq: q }) =>
          a(
            q(m.koshId, input.koshId),
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

      // Fetch kosh members & non-member borrowers for filtering options
      const activeMemberships = await db.query.koshMembership.findMany({
        where: (m, { and: a, eq: q }) =>
          a(q(m.koshId, input.koshId), q(m.status, "active")),
        with: {
          user: {
            columns: { id: true, name: true, image: true, email: true },
          },
        },
      });

      const nonMembers = await db.query.nonMemberBorrower.findMany({
        where: (nm, { eq: q }) => q(nm.koshId, input.koshId),
      });

      const memberOptions = [
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

      const selectedMemberId =
        input.memberId && input.memberId !== "all" ? input.memberId : null;

      const isUuid = (val: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          val,
        );

      // Prepare loan status filters
      const fetchLoans =
        input.status === "all" ||
        input.status === "active" ||
        input.status === "cleared";
      const fetchPending =
        input.status === "all" || input.status === "pending";

      let loansList: KoshLoanItem[] = [];
      if (fetchLoans) {
        const loanConditions = [eq(loan.koshId, input.koshId)];

        if (input.status === "active") {
          loanConditions.push(eq(loan.status, "active"));
        } else if (input.status === "cleared") {
          loanConditions.push(inArray(loan.status, ["paid_off", "defaulted"]));
        }

        if (selectedMemberId) {
          if (isUuid(selectedMemberId)) {
            loanConditions.push(
              or(
                eq(loan.borrowerId, selectedMemberId),
                eq(loan.nonMemberBorrowerId, selectedMemberId),
              )!,
            );
          } else {
            loanConditions.push(eq(loan.borrowerId, selectedMemberId));
          }
        }

        if (input.dateFrom) {
          loanConditions.push(gte(loan.issueDate, input.dateFrom));
        }
        if (input.dateTo) {
          loanConditions.push(lte(loan.issueDate, input.dateTo));
        }

        const rawLoans = await db
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
          .where(and(...loanConditions))
          .orderBy(desc(loan.createdAt));

        loansList = rawLoans.map((l) => {
          const principal = parseFloat(l.principal);
          const monthlyRate = parseFloat(l.interestRate);
          const yearlyRate = monthlyRate * 12;
          const monthlyInterestAmount =
            Math.round(principal * (monthlyRate / 100) * 100) / 100;

          return {
            id: l.id,
            type: "loan" as const,
            koshId: l.koshId,
            borrowerId: l.borrowerId ?? l.nonMemberBorrowerId,
            borrowerName: l.borrowerName,
            borrowerAvatar: l.borrowerImage,
            isNonMember: !l.borrowerId,
            principal: l.principal,
            interestRate: l.interestRate,
            monthlyInterestRate: String(monthlyRate),
            yearlyInterestRate: String(yearlyRate),
            monthlyInterestAmount: String(monthlyInterestAmount),
            issueDate: l.issueDate,
            dueDate: l.dueDate,
            status: l.status as "active" | "paid_off" | "defaulted",
            amountRemaining: l.amountRemaining,
            totalRepaid: l.totalRepaid,
            totalInterestPaid: l.totalInterestPaid,
            createdAt: l.createdAt.toISOString(),
          };
        });
      }

      let pendingList: KoshPendingLoanRequestItem[] = [];
      if (fetchPending) {
        const pendingConditions = [
          eq(loanRequest.koshId, input.koshId),
          inArray(loanRequest.status, [
            "pending_adhyaksh",
            "pending_koshadhyaksh",
          ]),
        ];

        if (selectedMemberId) {
          if (isUuid(selectedMemberId)) {
            pendingConditions.push(
              or(
                eq(loanRequest.requestedBy, selectedMemberId),
                eq(loanRequest.nonMemberBorrowerId, selectedMemberId),
              )!,
            );
          } else {
            pendingConditions.push(
              eq(loanRequest.requestedBy, selectedMemberId),
            );
          }
        }

        if (input.dateFrom) {
          pendingConditions.push(
            gte(loanRequest.createdAt, new Date(`${input.dateFrom}T00:00:00`)),
          );
        }
        if (input.dateTo) {
          pendingConditions.push(
            lte(loanRequest.createdAt, new Date(`${input.dateTo}T23:59:59`)),
          );
        }

        const rawRequests = await db
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
          .where(and(...pendingConditions))
          .orderBy(desc(loanRequest.createdAt));

        pendingList = rawRequests.map((r) => ({
          id: r.id,
          type: "request" as const,
          koshId: r.koshId,
          borrowerId: r.requestedBy ?? r.nonMemberBorrowerId,
          borrowerName: r.borrowerName,
          borrowerAvatar: r.borrowerImage,
          isNonMember: !r.requestedBy,
          amountRequested: r.amountRequested,
          note: r.note,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
        }));
      }

      const activeLoans = loansList.filter((l) => l.status === "active");
      const clearedLoans = loansList.filter(
        (l) => l.status === "paid_off" || l.status === "defaulted",
      );

      const totalActiveAmount = activeLoans.reduce(
        (acc, l) => acc + parseFloat(l.principal),
        0,
      );
      const totalPendingAmount = pendingList.reduce(
        (acc, r) => acc + parseFloat(r.amountRequested),
        0,
      );
      const totalClearedAmount = clearedLoans.reduce(
        (acc, l) => acc + parseFloat(l.principal),
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
          activeCount: activeLoans.length,
          activeAmount: String(totalActiveAmount),
          pendingCount: pendingList.length,
          pendingAmount: String(totalPendingAmount),
          clearedCount: clearedLoans.length,
          clearedAmount: String(totalClearedAmount),
        },
        activeLoans,
        pendingRequests: pendingList,
        clearedLoans,
      };
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
  status: "active" | "paid_off" | "defaulted";
  amountRemaining: string;
  totalRepaid: string;
  totalInterestPaid: string;
  createdAt: string;
};

export type KoshLoanItem = {
  id: string;
  type: "loan";
  koshId: string;
  borrowerId: string | null;
  borrowerName: string;
  borrowerAvatar: string | null;
  isNonMember: boolean;
  principal: string;
  interestRate: string;
  monthlyInterestRate: string;
  yearlyInterestRate: string;
  monthlyInterestAmount: string;
  issueDate: string;
  dueDate: string | null;
  status: "active" | "paid_off" | "defaulted";
  amountRemaining: string;
  totalRepaid: string;
  totalInterestPaid: string;
  createdAt: string;
};

export type KoshPendingLoanRequestItem = {
  id: string;
  type: "request";
  koshId: string;
  borrowerId: string | null;
  borrowerName: string;
  borrowerAvatar: string | null;
  isNonMember: boolean;
  amountRequested: string;
  note: string | null;
  status: string;
  createdAt: string;
};

export type LoanStatusFilter = "all" | "active" | "paid_off" | "defaulted";
export type KoshLoanTabFilter = "all" | "active" | "pending" | "cleared";
export type LoanStats = {
  activeLoanCount: number;
  totalBorrowed: string;
  totalRemaining: string;
  totalRepaid: string;
};
