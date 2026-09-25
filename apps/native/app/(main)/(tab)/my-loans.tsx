import { AnimatedView } from "@/components/animated-view";
import { HorizontalKoshSelector } from "@/components/kosh/horizontal-kosh-selector";
import { ErrorComponent } from "@/components/layout/error-component";
import { LoanCard } from "@/components/loan/loan-card";
import { LoanStats } from "@/components/loan/loan-stats";
import { StyledSymbolView } from "@/components/styled-symbol-view";
import { ThemedText } from "@/components/themed-text";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { trpc } from "@/utils/trpc";
import type { LoanStatusFilter, MyLoanItem } from "@kosh-app/api/routers/loan";
import { LegendList } from "@legendapp/list/react-native";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { FadeInUp } from "react-native-reanimated";

const LoanScreen = () => {
  const { selectedKosh } = useLocalSearchParams<{ selectedKosh?: string }>();
  const [statusFilter, setStatusFilter] = useState<LoanStatusFilter>("all");

  // 1. Separate Stats Query
  const statsQuery = useQuery({
    ...trpc.loan.myStats.queryOptions(
      selectedKosh ? { koshId: selectedKosh } : {},
    ),
  });

  // 2. Infinite Query for Loans
  const loansQuery = useInfiniteQuery({
    ...trpc.loan.myLoansFeed.infiniteQueryOptions(
      {
        koshId: selectedKosh,
        status: statusFilter,
        limit: 15,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    ),
  });

  const loanItems = useMemo(
    () => loansQuery.data?.pages.flatMap((page) => page.items ?? []) ?? [],
    [loansQuery.data?.pages],
  );

  const activeItemsCount = useMemo(
    () => loanItems.filter((i) => i.status === "active").length,
    [loanItems],
  );

  const pendingItemsCount = useMemo(
    () =>
      loanItems.filter(
        (i) =>
          i.status === "pending_adhyaksh" ||
          i.status === "pending_koshadhyaksh",
      ).length,
    [loanItems],
  );

  const clearedItemsCount = useMemo(
    () =>
      loanItems.filter(
        (i) => i.status === "paid_off" || i.status === "defaulted",
      ).length,
    [loanItems],
  );

  const handleRefresh = useCallback(() => {
    statsQuery.refetch();
    loansQuery.refetch();
  }, [statsQuery, loansQuery]);

  const handleEndReached = useCallback(() => {
    if (loansQuery.hasNextPage && !loansQuery.isFetchingNextPage) {
      loansQuery.fetchNextPage();
    }
  }, [
    loansQuery.hasNextPage,
    loansQuery.isFetchingNextPage,
    loansQuery.fetchNextPage,
  ]);

  const keyExtractor = useCallback((item: MyLoanItem) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: MyLoanItem }) => (
      <View className="mb-3">
        <LoanCard item={item} />
      </View>
    ),
    [],
  );

  const ListHeader = useMemo(
    () => (
      <View className="gap-y-5 pb-2">
        <ThemedText className="text-2xl font-notosans-semibold">
          My Loans
        </ThemedText>
        <HorizontalKoshSelector />
        <LoanStats stats={statsQuery.data} isPending={statsQuery.isPending} />
        <View className="bg-background pt-2 pb-1">
          <Tabs
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as LoanStatusFilter)}
          >
            <Tabs.List>
              <Tabs.Indicator />
              <Tabs.Trigger className="flex-1 px-0" value="all">
                <Tabs.Label className="text-xs font-mono-semibold">
                  All
                </Tabs.Label>
              </Tabs.Trigger>
              <Tabs.Trigger className="flex-1 px-0" value="active">
                <Tabs.Label className="text-xs font-mono-semibold">
                  Active ({activeItemsCount})
                </Tabs.Label>
              </Tabs.Trigger>
              <Tabs.Trigger className="flex-1 px-0" value="pending">
                <Tabs.Label className="text-xs font-mono-semibold">
                  Pending ({pendingItemsCount})
                </Tabs.Label>
              </Tabs.Trigger>
              <Tabs.Trigger className="flex-1 px-0" value="cleared">
                <Tabs.Label className="text-xs font-mono-semibold">
                  Cleared ({clearedItemsCount})
                </Tabs.Label>
              </Tabs.Trigger>
            </Tabs.List>
          </Tabs>
        </View>
      </View>
    ),
    [
      statsQuery.data,
      statsQuery.isPending,
      statusFilter,
      activeItemsCount,
      pendingItemsCount,
      clearedItemsCount,
    ],
  );

  const ListEmpty = useMemo(() => {
    if (loansQuery.isPending) {
      return (
        <View className="py-8 items-center justify-center">
          <ActivityIndicator />
        </View>
      );
    }
    return (
      <AnimatedView entering={FadeInUp.duration(300)}>
        <Card className="p-8 items-center justify-center gap-y-2">
          <StyledSymbolView
            tintColorClassName="accent-muted"
            size={32}
            name={{ android: "money_off" }}
          />
          <ThemedText className="text-muted-foreground text-sm font-mono-regular text-center">
            {statusFilter === "all"
              ? "You have no loans in any of your Koshes."
              : `No ${statusFilter} loans found.`}
          </ThemedText>
        </Card>
      </AnimatedView>
    );
  }, [loansQuery.isPending, statusFilter]);

  const ListFooter = useMemo(() => {
    if (loansQuery.isFetchingNextPage) {
      return (
        <View className="py-4 items-center justify-center">
          <ActivityIndicator />
        </View>
      );
    }
    return <View className="h-20" />;
  }, [loansQuery.isFetchingNextPage]);

  if (loansQuery.isError) {
    return (
      <ErrorComponent
        refetch={handleRefresh}
        message={loansQuery.error?.message ?? "Failed to load loans."}
      />
    );
  }

  return (
    <LegendList
      data={loanItems}
      recycleItems
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={ListEmpty}
      ListFooterComponent={ListFooter}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      onRefresh={handleRefresh}
      refreshing={loansQuery.isRefetching || statsQuery.isRefetching}
      contentContainerClassName="px-4 pt-safe-offset-16 pb-safe-offset-10"
      showsVerticalScrollIndicator={false}
    />
  );
};

export default LoanScreen;
