import { authClient } from "@/lib/auth-client";
import { chatThreadsQueryKey, queryClient, trpc } from "@/utils/trpc";
import type { ChatMessageItem } from "@kosh-app/api/routers/chat";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef } from "react";

const POLL_INTERVAL_MS = 3000;
const PAGE_SIZE = 30; // was 15 for history / 50 for recent — one size now

export type ChatTranscript = {
  threadId: string;
  myUserId: string;
  me: { name?: string | null; image?: string | null } | undefined;
  isGroup: boolean;
  koshId: string;
  title: string;
  history: ChatMessageItem[]; // now the ONLY source — full flattened list
  recent: ChatMessageItem[]; // kept as [] so buildChatEntries' signature is untouched
  isHistoryPending: boolean;
  isHistoryError: boolean;
  isRefetching: boolean;
  isFetchingOlder: boolean;
  hasOlder: boolean;
  errorMessage: string;
  loadOlder: () => void;
  refresh: () => void;
  refetchThread: () => Promise<void>;
  invalidateThreadLists: () => void;
};

export const useChatTranscript = (threadId: string): ChatTranscript => {
  const { data: session } = authClient.useSession();
  const myUserId = session?.user.id ?? "";
  const me = session?.user;

  const headerQuery = useQuery(
    trpc.chat.getThread.queryOptions({ threadId }, { enabled: !!threadId }),
  );

  const messagesQuery = useInfiniteQuery(
    trpc.chat.messages.infiniteQueryOptions(
      { threadId, limit: PAGE_SIZE },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );

  /**
   * Read the query result field by field rather than depending on the result
   * object.
   *
   * `useInfiniteQuery` hands back a brand new result object on every render -
   * `getOptimisticResult` rebuilds it each call even when nothing changed. The
   * query *functions* are bound once per observer and the flags are booleans,
   * so those are the only parts with a stable identity.
   *
   * Depending on `messagesQuery` itself therefore rebuilds every callback below
   * on every render, which cascades into the hook's return memo, then into the
   * thread context value, and finally re-renders every consumer of it - none of
   * which changes when the messages have not.
   */
  const { fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    messagesQuery;

  const messagesQueryKey = useMemo(
    () => trpc.chat.messages.infiniteQueryKey({ threadId, limit: PAGE_SIZE }),
    [threadId],
  );

  // Poll a small "what's new" endpoint, then splice any messages the cache
  // doesn't already have onto page 0 — never touches older, already-loaded
  // pages, so their identity (and the list's scroll anchor) stays stable.
  useEffect(() => {
    if (!threadId) return;
    const interval = setInterval(async () => {
      const latest = await queryClient.query(
        trpc.chat.recent.queryOptions({ threadId, limit: 20 }),
      );
      if (!latest?.length) return;

      queryClient.setQueryData(messagesQueryKey, (old) => {
        if (!old) return old;
        const page0 = old.pages[0]?.items ?? [];
        const knownIds = new Set(page0.map((m) => m.id));
        const fresh = latest.filter((m) => !knownIds.has(m.id));
        if (!fresh.length) return old; // nothing new — bail without a re-render

        const nextPage0 = { ...old.pages[0], items: [...page0, ...fresh] };
        return {
          ...old,
          pages: [nextPage0, ...old.pages.slice(1)],
        };
      });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [threadId, messagesQueryKey]);

  const history = useMemo(
    () => messagesQuery.data?.pages.flatMap((page) => page.items ?? []) ?? [],
    [messagesQuery.data?.pages],
  );

  const refetchThread = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const invalidateThreadLists = useCallback(() => {
    // Built by `chatThreadsQueryKey`, NOT `trpc.chat.listThreads.queryKey()`:
    // the bare `queryKey()` is keyed `type: "query"` while this list is an
    // infinite query, so the filter matches nothing and the invalidation
    // silently does nothing. See the helper for the full story.
    queryClient.setQueriesData(
      { queryKey: chatThreadsQueryKey() },
      (oldData: any) => {
        if (!oldData?.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            items: page.items.map((item: any) =>
              item.id === threadId ? { ...item, unreadCount: 0 } : item,
            ),
          })),
        };
      },
    );
    void queryClient.invalidateQueries({ queryKey: chatThreadsQueryKey() });
    void queryClient.invalidateQueries({
      queryKey: trpc.chat.unreadTotal.queryKey(),
    });
  }, [threadId]);

  const markRead = useMutation(
    trpc.chat.markRead.mutationOptions({ onSuccess: invalidateThreadLists }),
  ).mutate;
  const lastReadMessageId = useRef<string | null>(null);

  // `history` is unsorted-across-pages input to buildChatEntries, which sorts
  // internally — but for "what's newest," page 0 IS the newest page (cursor
  // pagination goes backward from `nextCursor`), so take the max within it.
  const newestMessage = useMemo(() => {
    const page0 = messagesQuery.data?.pages[0]?.items ?? [];
    if (!page0.length) return undefined;
    return page0.reduce((max, m) =>
      new Date(m.createdAt) > new Date(max.createdAt) ? m : max,
    );
  }, [messagesQuery.data?.pages]);

  useEffect(() => {
    if (!threadId || !myUserId || !newestMessage) return;
    if (newestMessage.senderId === myUserId) return;
    if (lastReadMessageId.current === newestMessage.id) return;
    lastReadMessageId.current = newestMessage.id;
    markRead({ threadId });
  }, [newestMessage, myUserId, threadId, markRead]);

  const loadOlder = useCallback(() => {
    if (isFetchingNextPage) return;
    if (hasNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const refresh = useCallback(() => {
    void refetchThread();
  }, [refetchThread]);

  const isGroup = headerQuery.data?.type === "group";
  const koshId = headerQuery.data?.koshId ?? "";
  const title = headerQuery.isPending
    ? "Loading..."
    : (headerQuery.data?.title ?? "Chat messages");

  return useMemo(
    () => ({
      threadId,
      myUserId,
      me,
      isGroup,
      koshId,
      title,
      history,
      recent: [], // buildChatEntries still accepts this param; now always empty
      isHistoryPending: messagesQuery.isPending,
      isHistoryError: messagesQuery.isError,
      isRefetching: messagesQuery.isRefetching,
      isFetchingOlder: messagesQuery.isFetchingNextPage,
      hasOlder: !!messagesQuery.hasNextPage,
      errorMessage: messagesQuery.error?.message ?? "Failed to load messages.",
      loadOlder,
      refresh,
      refetchThread,
      invalidateThreadLists,
    }),
    [
      threadId,
      myUserId,
      me,
      isGroup,
      koshId,
      title,
      history,
      messagesQuery.isPending,
      messagesQuery.isError,
      messagesQuery.isRefetching,
      messagesQuery.isFetchingNextPage,
      messagesQuery.hasNextPage,
      messagesQuery.error,
      loadOlder,
      refresh,
      refetchThread,
      invalidateThreadLists,
    ],
  );
};
