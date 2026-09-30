import {
  NOTIFICATION_FEED_POLL_INTERVAL_MS,
  notificationFeedQuery,
  notificationUnreadCountQuery,
  queryClient,
  trpc,
} from "@/utils/trpc";
import { useIsFocused } from "expo-router";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

/**
 * The unread count behind the bell.
 *
 * Its own hook so the badge does not have to know anything about the feed's
 * shape, and so the feed can be unmounted without the badge going quiet.
 */
export const useNotificationUnreadCount = () => {
  const query = useQuery(notificationUnreadCountQuery());
  return query.data ?? 0;
};

/**
 * Marks every notification in a thread read.
 *
 * Both caches are patched by hand rather than left to `invalidateQueries`: a tap
 * navigates away immediately, and an invalidation would refetch the whole feed
 * only to redraw rows the user has already left behind. The badge is
 * decremented by the count the server reports it actually marked, so the two
 * cannot drift apart.
 */
export const useMarkNotificationRead = () =>
  useMutation(
    trpc.notification.markRead.mutationOptions({
      onSuccess: ({ count }, { threadId }) => {
        if (count === 0) return;

        queryClient.setQueriesData(
          { queryKey: notificationUnreadCountQuery().queryKey },
          (old) => (typeof old === "number" ? Math.max(0, old - count) : old),
        );

        queryClient.setQueryData(notificationFeedQuery().queryKey, (old) => {
          if (!old?.pages) return old;

          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.threadId === threadId ? { ...item, unreadCount: 0 } : item,
              ),
            })),
          };
        });
      },
    }),
  );

export const useNotificationFeed = () => {
  const isFocused = useIsFocused();
  const markRead = useMarkNotificationRead();

  const query = useInfiniteQuery({
    ...notificationFeedQuery(),
    // `false` switches the interval off while another screen is focused. React
    // Query already pauses it when the app itself is backgrounded.
    refetchInterval: isFocused ? NOTIFICATION_FEED_POLL_INTERVAL_MS : false,
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  );

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]);

  /**
   * Read-on-tap. The row is only un-dotted once the server has confirmed, so a
   * failed mutation leaves the unread state intact instead of silently
   * swallowing it - the next poll restores the dot either way.
   */
  const markThreadRead = useCallback(
    (threadId: string) => markRead.mutate({ threadId }),
    [markRead],
  );

  return { ...query, items, loadMore, markThreadRead };
};
