import { protectedProcedure, publicProcedure, router } from "../index";
import { contributionRouter } from "./contribution";
import { inviteRouter } from "./invite";
import { koshRouter } from "./kosh";
import { loanRouter } from "./loan";
import { membershipRouter } from "./membership";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  kosh: koshRouter,
  membership: membershipRouter,
  invite: inviteRouter,
  contribution: contributionRouter,
  loan: loanRouter,
});
export type AppRouter = typeof appRouter;

