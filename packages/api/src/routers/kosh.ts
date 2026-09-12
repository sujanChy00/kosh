import { db } from "@kosh-app/db";
import { user } from "@kosh-app/db/schema/auth";
import { kosh, koshMembership } from "@kosh-app/db/schema/kosh";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no confusing 0/O, 1/I

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

function randomChars(length: number) {
  return Array.from(
    { length },
    () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)],
  ).join("");
}

/** `SAGA-7XPK` style: first 4 alphanumeric chars of the name + a random suffix. */
function generateKoshCode(name: string) {
  const prefix =
    name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 4) ||
    randomChars(4);
  return `${prefix}-${randomChars(4)}`;
}

async function getUniqueKoshCode(name: string) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateKoshCode(name);
    const existing = await db.query.kosh.findFirst({
      where: (k, { eq: q }) => q(k.code, code),
      columns: { id: true },
    });
    if (!existing) return code;
  }
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Could not generate a unique kosh code",
  });
}

export const koshRouter = router({
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
          const code = await getUniqueKoshCode(input.name);

          const [row] = await tx
            .insert(kosh)
            .values({
              code,
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