import { db } from "@kosh-app/db";
import { loan, loanRepayment } from "@kosh-app/db/schema/loans";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
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

export type LoanStatusFilter = "all" | "active" | "paid_off" | "defaulted";
export type LoanStats = {
  activeLoanCount: number;
  totalBorrowed: string;
  totalRemaining: string;
  totalRepaid: string;
};
