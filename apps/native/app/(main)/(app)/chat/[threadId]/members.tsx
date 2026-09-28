import { KoshMemberCard } from "@/components/kosh/membership/kosh-member-card";
import { ErrorComponent } from "@/components/layout/error-component";
import { ListFetchingMoreComponent } from "@/components/layout/list-fetching-more-component";
import { StyledSymbolView } from "@/components/styled-symbol-view";
import { ThemedText } from "@/components/themed-text";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/utils/trpc";
import type { ChatMemberItem } from "@kosh-app/api/routers/chat";
import { LegendList } from "@legendapp/list/react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo } from "react";
import { ActivityIndicator, View } from "react-native";

const PAGE_SIZE = 30;

const ChatMembers = () => {
  const { threadId, koshId } = useLocalSearchParams<{
    threadId: string;
    koshId: string;
  }>();

  const {
    data,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isRefetching,
    isPending,
    error,
    isError,
    refetch,
  } = useInfiniteQuery(
    trpc.chat.members.infiniteQueryOptions(
      { threadId, limit: PAGE_SIZE },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );

  // No dedupe pass, unlike the thread list: a roster cannot reorder (the cursor
  // is a strict (role, userId) keyset, and (koshId, userId) is unique), so
  // pages are disjoint by construction. Deduping would be a map rebuild on
  // every refetch for a case that cannot occur.
  const members = useMemo(
    () => (data?.pages ?? []).flatMap((page) => page.items),
    [data],
  );

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // The real roster size, not `members.length` - that only counts the pages
  // loaded so far, so a 50-member kosh would title itself "Members (30)" until
  // the user scrolled to the end. The server counts on the first page only, so
  // this is correct from the first paint and paging never re-counts.
  const total = data?.pages[0]?.total ?? members.length;

  const keyExtractor = useCallback((item: ChatMemberItem) => item.userId, []);

  const renderItem = useCallback(
    ({ item }: { item: ChatMemberItem }) => (
      <KoshMemberCard member={item} koshId={koshId} className="py-3 px-4" />
    ),
    [koshId],
  );

  const ListSeparator = useCallback(() => <Separator />, []);

  const ListEmpty = useMemo(() => {
    if (isPending) {
      return (
        <View className="py-10 items-center justify-center">
          <ActivityIndicator size={"large"} />
        </View>
      );
    }
    return (
      <Card className="p-8 items-center justify-center gap-y-2">
        <StyledSymbolView
          tintColorClassName="accent-muted-foreground"
          size={32}
          name={{ ios: "person.2", android: "group" }}
        />
        <ThemedText className="text-muted-foreground text-sm font-mono-regular text-center">
          No members to show.
        </ThemedText>
      </Card>
    );
  }, [isPending]);

  const ListFooter = useMemo(
    () => (
      <ListFetchingMoreComponent
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
      />
    ),
    [isFetchingNextPage, hasNextPage],
  );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isError) {
    return (
      <ErrorComponent
        refetch={handleRefresh}
        message={error?.message ?? "Failed to load members."}
      />
    );
  }

  return (
    <>
      <Stack.Title>Members ({total})</Stack.Title>

      <LegendList
        data={members}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        onEndReached={loadMore}
        ItemSeparatorComponent={ListSeparator}
        onEndReachedThreshold={0.5}
        onRefresh={handleRefresh}
        refreshing={isRefetching}
        estimatedItemSize={48}
        contentContainerClassName="pt-4 pb-safe-offset-10"
        showsVerticalScrollIndicator={false}
      />
    </>
  );
};

export default ChatMembers;
