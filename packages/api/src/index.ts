import { initTRPC, TRPCError } from "@trpc/server";

import type { Context } from "./context";

export const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    let userMessage = error.message;

    // Transform technical SQL / database driver errors into clean, relatable user messages
    if (
      userMessage.includes("invalid input syntax for type uuid") ||
      userMessage.includes("syntax error") ||
      (userMessage.includes("relation") &&
        userMessage.includes("does not exist")) ||
      (userMessage.includes("column") && userMessage.includes("does not exist"))
    ) {
      userMessage =
        "An error occurred while filtering records. Please check your selection and try again.";
    } else if (
      userMessage.includes("foreign key constraint") ||
      userMessage.includes("violates foreign key constraint")
    ) {
      userMessage =
        "This item cannot be modified or deleted because it is linked to active records.";
    } else if (
      userMessage.includes("unique constraint") ||
      userMessage.includes("violates unique constraint") ||
      userMessage.includes("duplicate key")
    ) {
      userMessage = "A record with this information already exists in the system.";
    } else if (
      userMessage.includes("check constraint") ||
      userMessage.includes("violates check constraint")
    ) {
      userMessage = "The submitted information does not satisfy system rules.";
    } else if (error.code === "INTERNAL_SERVER_ERROR" && (!userMessage || userMessage.includes("insert returned no row"))) {
      userMessage = "Something went wrong on our end. Please try again in a moment.";
    }

    return {
      ...shape,
      message: userMessage,
    };
  },
});

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
      cause: "No session",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});
