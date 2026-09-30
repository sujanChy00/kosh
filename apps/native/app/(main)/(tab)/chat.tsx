import { ChatThreadRow } from "@/components/chat/thread-row";
import { ErrorComponent } from "@/components/layout/error-component";
import { ListFetchingMoreComponent } from "@/components/layout/list-fetching-more-component";
import { StyledSymbolView } from "@/components/styled-symbol-view";
import { ThemedText } from "@/components/themed-text";
import { chatThreadsQuery } from "@/utils/trpc";
import type { ChatThreadListItem } from "@kosh-app/api/routers/chat";
import { LegendList } from "@legendapp/list/react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo } from "react";
import { ActivityIndicator, View } from "react-native";

const keyExtractor = (item: ChatThreadListItem) => item.id;

const renderItem = ({ item }: { item: ChatThreadListItem }) => (
  <ChatThreadRow thread={item} />
);

const ListHeader = () => (
  <View className="pb-2 pt-safe-offset-10 px-4">
    <ThemedText className="text-2xl font-notosans-semibold">Chat</ThemedText>
  </View>
);

const ChatScreen = () => {
  const {
    data,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isRefetching,
    refetch,
    isPending,
    error,
    isError,
  } = useInfiniteQuery(chatThreadsQuery());

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const threads = useMemo(() => {
    const byId = new Map<string, ChatThreadListItem>();
    for (const page of data?.pages ?? []) {
      for (const item of page.items) byId.set(item.id, item);
    }
    return [...byId.values()];
  }, [data]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const ListEmpty = useMemo(() => {
    if (isPending) {
      return (
        <View className="pt-20 items-center justify-center">
          <ActivityIndicator size={"large"} />
        </View>
      );
    }
    if (isError)
      return (
        <ErrorComponent
          refetch={handleRefresh}
          message={error?.message ?? "Failed to load chats."}
        />
      );
    return (
      <View className="p-8 pt-20 items-center justify-center gap-y-2 mx-4">
        <StyledSymbolView
          size={32}
          name={{ ios: "bubble.left.and.bubble.right", android: "forum" }}
        />
        <ThemedText className="text-muted-foreground text-sm font-mono-regular text-center">
          No chats yet. Your kosh&apos;s group chat will appear here once you
          join one.
        </ThemedText>
      </View>
    );
  }, [isPending, isError, error]);

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
      data={threads}
      recycleItems
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={ListEmpty}
      ListFooterComponent={ListFooter}
      maintainVisibleContentPosition={{ data: true, size: true }}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      onRefresh={handleRefresh}
      refreshing={isRefetching}
      estimatedItemSize={76}
      contentContainerClassName="pt-4 pb-safe-offset-10"
      showsVerticalScrollIndicator={false}
    />
  );
};

export default ChatScreen;
