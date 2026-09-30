import { NotificationRow } from "@/components/notification/notification-row";
import { ErrorComponent } from "@/components/layout/error-component";
import { ListFetchingMoreComponent } from "@/components/layout/list-fetching-more-component";
import { StyledSymbolView } from "@/components/styled-symbol-view";
import { ThemedText } from "@/components/themed-text";
import { useNotificationFeed } from "@/hooks/use-notification-feed";
import { useRouter } from "expo-router";
import { LegendList } from "@legendapp/list/react-native";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";

/**
 * Keyed by thread, not by notification id.
 *
 * `id` is the newest notification in the thread, so it changes every time a
 * message arrives - which is precisely when the row must *not* be treated as a
 * new item. A changed key would throw away the row's measured height and its
 * recycling state mid-scroll. The thread id is stable for the row's lifetime.
 */
const keyExtractor = (item: { threadId: string }) => item.threadId;

const NotificationScreen = () => {
  const router = useRouter();
  const [isPulling, setIsPulling] = useState(false);
  const {
    items,
    isPending,
    isError,
    error,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    loadMore,
    markThreadRead,
  } = useNotificationFeed();

  const handleRefresh = useCallback(async () => {
    setIsPulling(true);
    try {
      await refetch();
    } finally {
      setIsPulling(false);
    }
  }, [refetch]);

  const openThread = useCallback(
    (threadId: string) => {
      markThreadRead(threadId);
      router.push({
        pathname: "/chat/[threadId]",
        params: { threadId },
      });
    },
    [markThreadRead, router],
  );

  const renderItem = useCallback(
    ({ item }: { item: (typeof items)[number] }) => (
      <NotificationRow item={item} onPress={openThread} />
    ),
    [openThread],
  );

  /**
   * Both of these are rebuilt as elements on every render otherwise, and this
   * screen re-renders on every poll - so an inline element here hands the
   * header and footer new identities five times a minute for no reason.
   */
  const ListEmpty = useMemo(() => {
    if (isPending) {
      return (
        <View className="pt-20 items-center justify-center">
          <ActivityIndicator size={"large"} />
        </View>
      );
    }
    if (isError) {
      return (
        <ErrorComponent
          refetch={handleRefresh}
          message={error?.message ?? "Failed to load notifications."}
        />
      );
    }
    return (
      <View className="p-8 pt-20 items-center justify-center gap-y-2 mx-4">
        <StyledSymbolView
          size={32}
          name={{
            ios: "bell.slash",
            android: "notifications_off",
          }}
        />
        <ThemedText className="text-muted-foreground text-sm text-center">
          You&apos;re all caught up.
        </ThemedText>
      </View>
    );
  }, [isPending, isError, error, handleRefresh]);

  const ListFooter = useMemo(
    () => (
      <ListFetchingMoreComponent
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
      />
    ),
    [isFetchingNextPage, hasNextPage],
  );

  return (
    <LegendList
      data={items}
      recycleItems
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListEmptyComponent={ListEmpty}
      ListFooterComponent={ListFooter}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      onRefresh={handleRefresh}
      refreshing={isPulling}
      estimatedItemSize={72}
      contentContainerClassName="pt-2 pb-safe-offset-10"
      showsVerticalScrollIndicator={false}
    />
  );
};

export default NotificationScreen;
