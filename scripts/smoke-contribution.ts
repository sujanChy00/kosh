/**
 * Smoke test for the contribution router (record / recordBulk / periodData).
 * Creates throwaway users/members/loan, records contributions + repayments,
 * verifies amounts, then cleans everything up.
 *
 * Run from repo root:
 *   bun --env-file=apps/server/.env run scripts/smoke-contribution.ts
 */
import { db } from "@kosh-app/db";
import { session as sessionSchema } from "@kosh-app/db/schema/auth";
import { user } from "@kosh-app/db/schema/auth";
import { contribution } from "@kosh-app/db/schema/contributions";
import { koshMembership } from "@kosh-app/db/schema/kosh";
import { loan, loanRepayment } from "@kosh-app/db/schema/loans";
import { and, eq } from "drizzle-orm";

const SERVER = "http://localhost:3000";
const ADHYAKSH_ID = "kQzvJxn8fXDvM3RIOSfQabUlDqhKS6zn";
const KOSH_ID = "8b26f1eb-9f70-417f-8131-7eaf740b59d7";

const rand = () => Math.random().toString(36).slice(2, 10);
const uid = (prefix: string) => `${prefix}-${rand()}${rand()}`;

let sessionTokens: string[] = [];

async function rpc<T>(path: string, type: "query" | "mutation", input: unknown, token?: string) {
  const headers: Record<string, string> = {
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };

  let res: Response;
  if (type === "query") {
    const params = new URLSearchParams();
    if (input !== undefined) params.set("input", JSON.stringify(input));
    const qs = params.toString();
    res = await fetch(`${SERVER}/trpc/${path}${qs ? `?${qs}` : ""}`, {
      method: "GET",
      headers,
    });
  } else {
    headers["content-type"] = "application/json";
    res = await fetch(`${SERVER}/trpc/${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(input),
    });
  }

  const body = await res.json();

  const unwrap = (b: any): any =>
    b && "0" in b && b["0"] !== undefined ? b["0"] : b;

  const item = unwrap(body);
  if (item && "error" in item) {
    const errJson = item.error?.json ?? item.error;
    const err = new Error(
      errJson?.message ?? errJson?.data?.message ?? "trpc error",
    );
    (err as any).code = errJson?.code;
    (err as any).status = res.status;
    throw err;
  }
  return (item?.result?.data ?? item) as T;
}

const closeTo = (a: number, b: number, eps = 0.011) => Math.abs(a - b) <= eps;

async function makeSession(userId: string) {
  const token = `test-${uid("tok")}`;
  await db.insert(sessionSchema).values({
    id: uid("sid"),
    token,
    expiresAt: new Date(Date.now() + 7 * 86400_000),
    userId,
  });
  sessionTokens.push(token);
  return token;
}

let failures = 0;
function check(name: string, cond: boolean, extra = "") {
  console.log(`${cond ? "PASS" : "FAIL"} ${name}${extra ? ` — ${extra}` : ""}`);
  if (!cond) failures++;
}

async function main() {
  const adhyakshToken = await makeSession(ADHYAKSH_ID);
  const memberId = uid("smk");
  const sadasyaId = uid("smkss");
  let createdLoanId: string | null = null;
  let pd0: any = null;

  try {
    // ── Session works (bearer) ───────────────────────────────────────────
    const list = await rpc<any>("kosh.list", "query", { limit: 5 }, adhyakshToken);
    const myKosh = list.items.find((k: any) => k.id === KOSH_ID);
    check("kosh.list returns the kosh", Boolean(myKosh));
    const dueDay = myKosh.dueDay;
    const monthlyAmount = parseFloat(myKosh.monthlyAmount);
    const currency = myKosh.currency;
    console.log("  kosh:", { name: myKosh.name, dueDay, monthlyAmount, currency });

    // ── periodData without period → default period resolves ─────────────
    pd0 = await rpc<any>(
      "contribution.periodData",
      "query",
      { koshId: KOSH_ID },
      adhyakshToken,
    );
    check("periodData returns 1 member initially", pd0.members.length === 1, `n=${pd0.members.length}`);
    check("periodData defaultPeriod is a valid period", /^\d{4}-\d\d-01$/.test(pd0.defaultPeriod));
    check("periodData resolved period === defaultPeriod", pd0.period.value === pd0.defaultPeriod);
    check("periodData threshold is 5", pd0.recordedLateThresholdDays === 5);
    const expectedDefault = defaultPeriodFor(dueDay);
    check("defaultPeriod matches rule", pd0.defaultPeriod === expectedDefault, `${pd0.defaultPeriod} (want ${expectedDefault})`);
    const prevMember = pd0.members[0];
    check(
      "member prefill = monthlyAmount when no record",
      parseFloat(prevMember.contributionPrefill) === monthlyAmount,
    );
    check(
      "member expectedAmount = monthlyAmount",
      parseFloat(prevMember.expectedAmount) === monthlyAmount,
    );

    // ── Create throwaway member + a treasurer-only check ─────────────────
    await db.insert(user).values({
      id: memberId,
      name: "Smoke Member",
      email: `${memberId}@smoke.test`,
      emailVerified: true,
    });
    await db.insert(koshMembership).values({
      koshId: KOSH_ID,
      userId: memberId,
      role: "sadasya",
      status: "active",
      joinedAt: new Date(),
    });
    await db.insert(user).values({
      id: sadasyaId,
      name: "Smoke Sadasya",
      email: `${sadasyaId}@smoke.test`,
      emailVerified: true,
    });
    await db.insert(koshMembership).values({
      koshId: KOSH_ID,
      userId: sadasyaId,
      role: "sadasya",
      status: "active",
      joinedAt: new Date(),
    });

    // ── periodData now shows 3 members ───────────────────────────────────
    const pd1 = await rpc<any>(
      "contribution.periodData",
      "query",
      { koshId: KOSH_ID },
      adhyakshToken,
    );
    check("periodData now returns 3 members", pd1.members.length === 3, `n=${pd1.members.length}`);
    const smoke = pd1.members.find((m: any) => m.userId === memberId);
    check("smoke member prefills present", smoke && parseFloat(smoke.expectedAmount) === monthlyAmount);

    // ── Non-adhyaksh is forbidden ────────────────────────────────────────
    const sadasyaToken = await makeSession(sadasyaId);
    try {
      await rpc("contribution.periodData", "query", { koshId: KOSH_ID }, sadasyaToken);
      check("sadasya periodData forbidden", false);
    } catch (e: any) {
      check("sadasya periodData forbidden", e.message === "Only the Adhyaksh can record contributions");
    }
    try {
      await rpc(
        "contribution.record",
        "mutation",
        { koshId: KOSH_ID, period: pd0.period.value, memberId, contributionAmount: 100 },
        sadasyaToken,
      );
      check("sadasya record forbidden", false);
    } catch (e: any) {
      check("sadasya record forbidden", e.message === "Only the Adhyaksh can record contributions");
    }

    // ── Past-period bulk record: full + partial + penalty ───────────────
    // Choose a past period (3 months before default) so the due date passed.
    const past = shiftPeriod(pd0.period.value, -3);
    const paidAll = await rpc<any>(
      "contribution.recordBulk",
      "mutation",
      {
        koshId: KOSH_ID,
        period: past,
        entries: [
          { memberId: ADHYAKSH_ID, contributionAmount: monthlyAmount },
          { memberId, contributionAmount: monthlyAmount * 0.5 },
        ],
      },
      adhyakshToken,
    );
    check("recordBulk all entries ok", paidAll.summary.failed === 0, JSON.stringify(paidAll.summary));
    const aRow = paidAll.results.find((r: any) => r.memberId === ADHYAKSH_ID);
    const mRow = paidAll.results.find((r: any) => r.memberId === memberId);
    check("past full record status paid", aRow?.contribution?.status === "paid", aRow?.contribution?.status);
    check("past partial record status late", mRow?.contribution?.status === "late", mRow?.contribution?.status);
    check("past partial contributionAmount stored", closeTo(parseFloat(mRow?.contribution?.contributionAmount ?? "-1"), monthlyAmount * 0.5));

    // Penalty only applies when the period is past due AND short. Full payer
    // has no shortfall → penalty assessed 0.
    check(
    "full payer penalty assessed 0",
    parseFloat(aRow?.contribution?.penaltyAssessed ?? "-1") === 0,
    aRow?.contribution?.penaltyAssessed,
  );

    const latePenalty = pd0.kosh.latePenaltyAmount ?? "0";
    const upserted = await rpc<any>(
      "contribution.periodData",
      "query",
      { koshId: KOSH_ID, period: past },
      adhyakshToken,
    );
    const mData = upserted.members.find((m: any) => m.userId === memberId);
    const aData = upserted.members.find((m: any) => m.userId === ADHYAKSH_ID);
    check(
      "periodData penaltyPrefill reflects assessed (partial, late)",
      mData.penaltyPrefill !== null,
    );
    check(
      "full payer shows no extra penalty",
      parseFloat(aData.penaltyPrefill) === parseFloat(aData.existing?.penaltyAssessed ?? "0"),
    );

    // ── Loan + repayment split ───────────────────────────────────────────
    const principal = 50000;
    const rate = 12;
    const issueDaysAgo = 90;
    const issueDate = new Date();
    issueDate.setDate(issueDate.getDate() - issueDaysAgo);
    const isoIssue = issueDate.toISOString().slice(0, 10);
    const [loanRow] = await db
      .insert(loan)
      .values({
        koshId: KOSH_ID,
        borrowerId: memberId,
        principal: String(principal),
        interestRate: String(rate),
        issueDate: isoIssue,
        amountRemaining: String(principal),
        status: "active",
      })
      .returning();
    createdLoanId = loanRow.id;

    const accrued = principal * (rate / 100) * (issueDaysAgo / 365);
    const repayAmt = 5000;
    const interestPortion = Math.min(repayAmt, accrued);
    const principalPortion = repayAmt - interestPortion;
    const remAfter = principal - principalPortion;

    const repaid = await rpc<any>(
      "contribution.record",
      "mutation",
      {
        koshId: KOSH_ID,
        period: past,
        memberId,
        repaymentAmount: repayAmt,
      },
      adhyakshToken,
    );
    check("repayment ok", repaid.ok === true, JSON.stringify(repaid));
    check(
      "repayment interest-first split (interest)",
      closeTo(parseFloat(repaid.repayment?.interestPortion ?? "-1"), interestPortion),
      `got ${repaid.repayment?.interestPortion} want ~${interestPortion.toFixed(2)}`,
    );
    check(
      "repayment principal portion",
      closeTo(parseFloat(repaid.repayment?.principalPortion ?? "-1"), principalPortion),
      `got ${repaid.repayment?.principalPortion} want ~${principalPortion.toFixed(2)}`,
    );
    check(
      "remaining balance after",
      closeTo(parseFloat(repaid.repayment?.remainingBalanceAfter ?? "-1"), remAfter),
      `got ${repaid.repayment?.remainingBalanceAfter} want ~${remAfter.toFixed(2)}`,
    );

    const loanAfter = await db.query.loan.findFirst({ where: (l, { eq: q }) => q(l.id, loanRow.id) });
    check("loan amountRemaining updated", closeTo(parseFloat(loanAfter!.amountRemaining), remAfter));
    check("loan still active", loanAfter!.status === "active");

    // ── Over-payment rejected; contribution still saved (independence) ──
    const overpay = await rpc<any>(
      "contribution.recordBulk",
      "mutation",
      {
        koshId: KOSH_ID,
        period: past,
        entries: [
          {
            memberId,
            contributionAmount: monthlyAmount * 0.9, // contributes 90%
            repaymentAmount: principal + interestPortion + 1, // over-pays loan
          },
        ],
      },
      adhyakshToken,
    );
    const over = overpay.results[0];
    check("over-payment entry flagged failed", over.ok === false, over.error ?? "");
    check(
      "over-payment error message",
      over.error === "Repayment amount exceeds the outstanding balance",
      over.error ?? "",
    );
    check("over-payment entry has no repayment row", over.repayment == null);
    const overContrib = await db
      .select({ c: contribution.contributionAmount })
      .from(contribution)
      .where(and(eq(contribution.koshId, KOSH_ID), eq(contribution.memberId, memberId), eq(contribution.period, past)));
    check(
      "contribution was still written despite repayment failure",
      closeTo(parseFloat(overContrib[0].c), monthlyAmount * 0.9),
      `got ${overContrib[0].c}`,
    );

    // ── Repayment for a member with no active loan fails cleanly ────────
    const noLoan = await rpc<any>(
      "contribution.recordBulk",
      "mutation",
      {
        koshId: KOSH_ID,
        period: past,
        entries: [{ memberId: ADHYAKSH_ID, repaymentAmount: 100 }],
      },
      adhyakshToken,
    );
    check(
      "no-loan + repayment flagged failed",
      noLoan.results[0].ok === false && noLoan.results[0].error === "This member has no active loan to repay",
      noLoan.results[0].error ?? "",
    );

    // ── Totals move correctly ────────────────────────────────────────────
    // Collected: MB1 full (past) MB2 90% ... let project:
    // contributions: adhyaksh full (1), smoke: 0.5 then 0.9 → 1.4 total? No —
    // the second write overwrote the first (upsert). smoke = 0.9 of monthly.
    // contributions sum = monthly + 0.9*monthly
    // penalties: 0 paid (none recorded) → 0
    // loan interest collected = interestPortion (one repayment)
    // totalRemaining = collected − sum(amountRemaining active/defaulted)
    const contribSum = monthlyAmount + monthlyAmount * 0.9;
    const interestSum = interestPortion;
    const collected = contribSum + interestSum;
    const remaining = collected - remAfter;

    const listAfter = await rpc<any>("kosh.list", "query", { limit: 5 }, adhyakshToken);
    const koshAfter = listAfter.items.find((k: any) => k.id === KOSH_ID);
    check(
      "totalCollected matches formula",
      closeTo(parseFloat(koshAfter.totalCollected), collected),
      `got ${koshAfter.totalCollected} want ~${collected.toFixed(2)}`,
    );
    check(
      "totalRemaining matches formula",
      closeTo(parseFloat(koshAfter.totalRemaining), remaining),
      `got ${koshAfter.totalRemaining} want ~${remaining.toFixed(2)}`,
    );

    // ── Invalid entries rejected by zod ──────────────────────────────────
    try {
      await rpc("contribution.recordBulk", "mutation", {
        koshId: KOSH_ID,
        period: "2026-13-01",
        entries: [{ memberId }],
      }, adhyakshToken);
      check("bad period rejected", false);
    } catch (e: any) {
      check("bad period rejected", e.code === "BAD_REQUEST" || Boolean(e.code), String(e.code));
    }
    try {
      await rpc("contribution.recordBulk", "mutation", {
        koshId: KOSH_ID,
        period: past,
        entries: [{ memberId, contributionAmount: -5 }],
      }, adhyakshToken);
      check("negative amount rejected", false);
    } catch (e: any) {
      check("negative amount rejected", e.code === "BAD_REQUEST" || Boolean(e.code), String(e.code));
    }

    console.log(failures === 0 ? "\nALL SMOKE TESTS PASSED" : `\n${failures} SMOKE TESTS FAILED`);
  } finally {
    // ── Cleanup everything created by this run ───────────────────────────
    const testPeriods: string[] = [];
    if (pd0) {
      testPeriods.push(pd0.period.value, shiftPeriod(pd0.period.value, -3));
    }
    for (const p of testPeriods) {
      await db.delete(contribution).where(and(eq(contribution.koshId, KOSH_ID), eq(contribution.period, p)));
    }
    if (createdLoanId) {
      await db.delete(loanRepayment).where(eq(loanRepayment.loanId, createdLoanId));
      await db.delete(loan).where(eq(loan.id, createdLoanId));
    }
    await db.delete(koshMembership).where(
      and(eq(koshMembership.koshId, KOSH_ID), eq(koshMembership.userId, memberId)),
    );
    await db.delete(koshMembership).where(
      and(eq(koshMembership.koshId, KOSH_ID), eq(koshMembership.userId, sadasyaId)),
    );
    await db.delete(user).where(eq(user.id, memberId));
    await db.delete(user).where(eq(user.id, sadasyaId));
    for (const token of sessionTokens) {
      await db.delete(sessionSchema).where(eq(sessionSchema.token, token));
    }
    console.log("Cleanup done.");
  }
}

// ── Rule mirror (copied from router) for independent verification ──────────
function defaultPeriodFor(dueDay: number, today = new Date()) {
  const DAY_MS = 86_400_000;
  const LATE = 5;
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const daysUntil = (date: Date, now = new Date()) =>
    Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / DAY_MS);
  const periodFromParts = (year: number, month: number) => {
    const d = new Date(year, month - 1, 1);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-01`;
  };
  const anchor = startOfDay(today);
  const thisDue = new Date(today.getFullYear(), today.getMonth(), dueDay);
  let offset: number;
  if (anchor.getTime() > thisDue.getTime()) {
    const nextDue = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
    offset = daysUntil(nextDue, today) > LATE ? 0 : 1;
  } else {
    offset = daysUntil(thisDue, today) > LATE ? -1 : 0;
  }
  return periodFromParts(today.getFullYear(), today.getMonth() + 1 + offset);
}

function shiftPeriod(period: string, delta: number) {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

main()
  .catch((e) => {
    console.error("SMOKE TEST ERROR:", e);
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit(process.exitCode ?? (failures === 0 ? 0 : 1));
  });