import type { AppRouter } from "@kosh-app/api/routers/index";
import { env } from "@kosh-app/env/native";
import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { Platform } from "react-native";

import { authClient } from "@/lib/auth-client";

export const queryClient = new QueryClient();

const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${env.EXPO_PUBLIC_SERVER_URL}/trpc`,
      fetch: function (url, options) {
        return fetch(url, {
          ...options,
          // Better Auth Expo forwards the session cookie manually on native.
          credentials: Platform.OS === "web" ? "include" : "omit",
        });
      },
      async headers() {
        if (Platform.OS === "web") {
          return {};
        }
        const headers = new Map<string, string>();
        const cookies = await authClient.getCookie();
        if (cookies) {
          headers.set("Cookie", cookies);
        }
        return Object.fromEntries(headers);
      },
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});

/**
 * Single source of truth for the chat thread list's page size and query options.
 *
 * The list and its invalidations both derive from this, which is the point: a
 * key built anywhere else silently stops matching the moment either side changes.
 *
 * `trpc.chat.listThreads.queryKey()` looks like it should work for invalidating,
 * but it silently matches nothing. It emits `{ type: "query" }`, while this list
 * is an infinite query and so is keyed `{ type: "infinite", input: { limit } }`.
 * `invalidateQueries` matches a filter against a query key by requiring the
 * filter's entries to be present in the key, so a filter that disagrees on
 * `type` matches zero queries.
 *
 * That made every invalidation of the thread list a silent no-op: sending a
 * message or reading a thread did not refresh the list, which kept showing the
 * previous message's preview and a stale unread badge until the user pulled to
 * refresh. A no-op invalidation is the worst kind of bug - the code reads as if
 * it refreshes, and nothing warns that it does not.
 */
export const CHAT_THREADS_PAGE_SIZE = 20;

export const chatThreadsQuery = () =>
  trpc.chat.listThreads.infiniteQueryOptions(
    { limit: CHAT_THREADS_PAGE_SIZE },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

export const chatThreadsQueryKey = () => chatThreadsQuery().queryKey;
