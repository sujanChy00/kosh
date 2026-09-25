import { KoshContributionCard } from "@/components/kosh/kosh-contribution-card";
import { ErrorComponent } from "@/components/layout/error-component";
import { ListFetchingMoreComponent } from "@/components/layout/list-fetching-more-component";
import { ListSeparatorComponent } from "@/components/layout/list-separator-component";
import { PendingComponent } from "@/components/layout/pending-component";
import { ThemedText } from "@/components/themed-text";
import { Tabs } from "@/components/ui/tabs";
import { trpc } from "@/utils/trpc";
import type {
  ContributionStatusFilter,
  KoshContributionHistoryItem,
} from "@kosh-app/api/routers/contribution";
import { LegendList } from "@legendapp/list/react-native";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { View } from "react-native";

const PAGE_SIZE = 15;

const ContributionHistoryScreen = () => {
  const { id: koshId } = useLocalSearchParams<{ id: string }>();
  const [statusFilter, setStatusFilter] =
    useState<ContributionStatusFilter>("all");

  const { data: koshData } = useQuery({
    ...trpc.kosh.getById.queryOptions({ koshId: koshId ?? "" }),
    enabled: !!koshId,
  });

  const {
    data,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isRefetching,
    refetch,
    isLoading,
    error,
    isError,
  } = useInfiniteQuery(
    trpc.contribution.historyByKosh.infiniteQueryOptions(
      {
        koshId: koshId ?? "",
        status: statusFilter,
        limit: PAGE_SIZE,
      },
      {
        enabled: !!koshId,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    ),
  );

  const historyList = useMemo(() => {
    return data?.pages.flatMap((page) => page.items) ?? [];
  }, [data]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: KoshContributionHistoryItem }) => (
      <KoshContributionCard item={item} />
    ),
    [],
  );

  const keyExtractor = useCallback(
    (item: KoshContributionHistoryItem) => item.id.toString(),
    [],
  );

  const ListSeparator = useCallback(() => <ListSeparatorComponent />, []);

  const ListFooterComponent = useCallback(
    () => (
      <ListFetchingMoreComponent
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
      />
    ),
    [isFetchingNextPage, hasNextPage],
  );

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          headerTitle: koshData?.name
            ? `${koshData.name} - Contributions`
            : "Contribution History",
        }}
      />

      <View className="px-4 pt-3 pb-2 z-10 bg-background">
        <Tabs
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val as ContributionStatusFilter)}
        >
          <Tabs.List>
            <Tabs.Indicator />
            <Tabs.Trigger value="all" className="flex-1 px-0">
              <Tabs.Label className="text-xs font-mono-semibold">All</Tabs.Label>
            </Tabs.Trigger>
            <Tabs.Trigger value="paid" className="flex-1 px-0">
              <Tabs.Label className="text-xs font-mono-semibold">Paid</Tabs.Label>
            </Tabs.Trigger>
            <Tabs.Trigger value="pending" className="flex-1 px-0">
              <Tabs.Label className="text-xs font-mono-semibold">
                Pending
              </Tabs.Label>
            </Tabs.Trigger>
            <Tabs.Trigger value="late" className="flex-1 px-0">
              <Tabs.Label className="text-xs font-mono-semibold">Late</Tabs.Label>
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs>
      </View>

      {isLoading ? (
        <PendingComponent />
      ) : isError ? (
        <ErrorComponent
          message={error?.message ?? "Could not load contribution history."}
          refetch={refetch}
        />
      ) : historyList.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <ThemedText className="text-muted-foreground font-mono-regular text-center">
            No contribution history found.
          </ThemedText>
        </View>
      ) : (
        <LegendList
          maintainVisibleContentPosition
          contentContainerClassName="px-4 pt-2 pb-safe-offset-12"
          data={historyList}
          drawDistance={500}
          onEndReachedThreshold={0.5}
          onEndReached={loadMore}
          refreshing={isRefetching}
          onRefresh={refetch}
          ItemSeparatorComponent={ListSeparator}
          estimatedItemSize={140}
          showsVerticalScrollIndicator={false}
          recycleItems
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListFooterComponent={ListFooterComponent}
          experimental_adaptiveRender={{
            enterVelocity: 6,
            exitVelocity: 3,
            exitDelay: 250,
          }}
        />
      )}
    </View>
  );
};

export default ContributionHistoryScreen;
