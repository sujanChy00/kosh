import { authClient } from "@/lib/auth-client";
import { queryClient, trpc } from "@/utils/trpc";
import type { ChatMessageItem } from "@kosh-app/api/routers/chat";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef } from "react";

const POLL_INTERVAL_MS = 3000;
const HISTORY_PAGE_SIZE = 20;
const RECENT_PAGE_SIZE = 50;

export type ChatTranscript = {
  threadId: string;
  myUserId: string;
  me: { name?: string | null; image?: string | null } | undefined;
  isGroup: boolean;
  koshId: string;
  title: string;
  history: ChatMessageItem[];
  recent: ChatMessageItem[];
  isHistoryPending: boolean;
  isHistoryError: boolean;
  isRefetching: boolean;
  isFetchingOlder: boolean;
  hasOlder: boolean;
  errorMessage: string;
  loadOlder: () => void;
  refresh: () => void;
  /**
   * Re-reads the authoritative rows for the open thread. Resolves once the
   * refetch has landed, which is what makes it safe to clear an optimistic patch
   * straight after awaiting this - otherwise a success would briefly snap the
   * row back to its pre-mutation state while the refetch was still in flight.
   */
  refetchThread: () => Promise<void>;
  /** Drops the thread list and the unread badge. */
  invalidateThreadLists: () => void;
};

/**
 * Everything the transcript reads: the three thread queries, the flattened
 * message lists, and the handles the list and mutations drive.
 *
 * Split from the optimistic layer on purpose. This half is poll-driven and
 * changes on a 3s timer whether or not the user did anything, so keeping it in
 * its own hook makes the line between "the server told us something" and "we
 * guessed something locally" visible in the file tree.
 */
export const useChatTranscript = (threadId: string): ChatTranscript => {
  const { data: session } = authClient.useSession();
  const myUserId = session?.user.id ?? "";
  const me = session?.user;

  const headerQuery = useQuery(
    trpc.chat.getThread.queryOptions({ threadId }, { enabled: !!threadId }),
  );

  const historyQuery = useInfiniteQuery(
    trpc.chat.messages.infiniteQueryOptions(
      { threadId, limit: HISTORY_PAGE_SIZE },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );

  // The polled tail. Kept as a separate query from history so that a 3s poll
  // never re-renders the whole backlog.
  const recentQuery = useQuery({
    ...trpc.chat.recent.queryOptions({ threadId, limit: RECENT_PAGE_SIZE }),
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
  });

  const history = useMemo(
    () => historyQuery.data?.pages.flatMap((page) => page.items ?? []) ?? [],
    [historyQuery.data?.pages],
  );
  const recent = useMemo(() => recentQuery.data ?? [], [recentQuery.data]);

  /**
   * Re-reads the authoritative rows. Separate from a plain `refresh` because
   * callers await this one before dropping an optimistic patch, so it has to
   * resolve after the refetch has actually landed.
   */
  const refetchThread = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: trpc.chat.recent.queryKey({ threadId }),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.chat.messages.queryKey({ threadId }),
      }),
    ]);
  }, [threadId]);

  const invalidateThreadLists = useCallback(() => {
    // Prefix match, so every page of the list is dropped. The badge has its own
    // query and does not read the list, so it has to be invalidated separately.
    void queryClient.invalidateQueries({
      queryKey: trpc.chat.listThreads.queryKey(),
    });
    void queryClient.invalidateQueries({
      queryKey: trpc.chat.unreadTotal.queryKey(),
    });
  }, []);

  /**
   * Clear the unread badge on open and whenever a poll brings in something from
   * someone else, so it does not linger while the thread is on screen.
   */
  const markRead = useMutation(
    trpc.chat.markRead.mutationOptions({
      onSuccess: invalidateThreadLists,
    }),
  ).mutate;
  const lastReadMessageId = useRef<string | null>(null);

  useEffect(() => {
    if (!threadId || !myUserId) return;
    const newest = recent[recent.length - 1];
    if (!newest || newest.senderId === myUserId) return;
    if (lastReadMessageId.current === newest.id) return;
    lastReadMessageId.current = newest.id;
    markRead({ threadId });
  }, [recent, myUserId, threadId, markRead]);

  const loadOlder = useCallback(() => {
    if (historyQuery.isFetchingNextPage) return;
    if (historyQuery.hasNextPage) void historyQuery.fetchNextPage();
  }, [historyQuery]);

  const refresh = useCallback(() => {
    void historyQuery.refetch();
    void recentQuery.refetch();
  }, [historyQuery, recentQuery]);

  const isGroup = headerQuery.data?.type === "group";
  const koshId = headerQuery.data?.koshId ?? "";
  const title = headerQuery.isPending
    ? "Loading..."
    : (headerQuery.data?.title ?? "Chat messages");

  /**
   * Memoised so the context value is referentially stable while nothing the
   * transcript actually shows has changed. Without this every keystroke in the
   * composer would hand the list a new object and re-render the transcript.
   */
  return useMemo(
    () => ({
      threadId,
      myUserId,
      me,
      isGroup,
      koshId,
      title,
      history,
      recent,
      isHistoryPending: historyQuery.isPending,
      isHistoryError: historyQuery.isError,
      isRefetching: historyQuery.isRefetching,
      isFetchingOlder: historyQuery.isFetchingNextPage,
      hasOlder: !!historyQuery.hasNextPage,
      errorMessage: historyQuery.error?.message ?? "Failed to load messages.",
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
      recent,
      historyQuery.isPending,
      historyQuery.isError,
      historyQuery.isRefetching,
      historyQuery.isFetchingNextPage,
      historyQuery.hasNextPage,
      historyQuery.error,
      loadOlder,
      refresh,
      refetchThread,
      invalidateThreadLists,
    ],
  );
};
