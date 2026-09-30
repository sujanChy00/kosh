import { protectedProcedure, publicProcedure, router } from "../index";
import { chatRouter } from "./chat";
import { contributionRouter } from "./contribution";
import { inviteRouter } from "./invite";
import { koshRouter } from "./kosh";
import { loanRouter } from "./loan";
import { membershipRouter } from "./membership";
import { notificationRouter } from "./notification";

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
  chat: chatRouter,
  notification: notificationRouter,
});
export type AppRouter = typeof appRouter;
