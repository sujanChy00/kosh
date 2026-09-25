import { AnimatedView } from "@/components/animated-view";
import { KoshContributionFilters } from "@/components/kosh/kosh-contribution-filters";
import { KoshContributionList } from "@/components/kosh/kosh-contribution-list";
import { EmptyComponent } from "@/components/layout/empty-component";
import { ErrorComponent } from "@/components/layout/error-component";
import { PendingComponent } from "@/components/layout/pending-component";
import { ThemedText } from "@/components/themed-text";
import { trpc } from "@/utils/trpc";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useGlobalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { View } from "react-native";
import { FadeInUp, FadeOut, LinearTransition } from "react-native-reanimated";

const PAGE_SIZE = 10;

const AllContributionsScreen = () => {
  const {
    id: koshId,
    dateFrom,
    dateTo,
    memberId,
    memberName,
  } = useGlobalSearchParams<{
    id: string;
    memberId?: string;
    dateFrom?: string;
    dateTo?: string;
    memberName?: string;
  }>();
  const router = useRouter();

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
  } = useInfiniteQuery(
    trpc.contribution.allContributionsByKosh.infiniteQueryOptions(
      {
        koshId,
        memberId: memberId === "all" ? undefined : memberId,
        dateFrom,
        dateTo,
        limit: PAGE_SIZE,
      },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  const isFiltered = !!memberId || !!dateFrom || !!dateTo;

  const clearFilters = useCallback(() => {
    router.setParams({
      memberId: undefined,
      memberName: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    });
  }, [router]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isPending) return <PendingComponent />;

  if (isError) {
    return (
      <ErrorComponent
        refetch={refetch}
        message={error?.message ?? "Failed to load contribution history."}
      />
    );
  }

  return (
    <View className="flex-1 bg-background">
      <KoshContributionFilters />
      {items.length === 0 ? (
        <EmptyComponent
          actionButtonOnPress={clearFilters}
          actionButtonContent={
            <ThemedText className="text-primary-foreground">
              Clear Filters
            </ThemedText>
          }
          message={
            isFiltered
              ? "No contributions match your filters"
              : "No contribution history found"
          }
          description={
            isFiltered
              ? "Try adjusting or resetting the filters."
              : "Contribution records for this kosh will appear here."
          }
        />
      ) : (
        <View className="flex-1">
          {isFiltered && (
            <AnimatedView
              entering={FadeInUp.duration(200)}
              exiting={FadeOut.duration(150)}
              layout={LinearTransition.duration(200)}
              className="p-4 pb-0 justify-center gap-y-1"
            >
              {!!memberName && (
                <ThemedText className="text-xs">
                  Showing{" "}
                  <ThemedText className="text-danger font-mono-medium">
                    ({items.length})
                  </ThemedText>{" "}
                  results for:{" "}
                  <ThemedText className="text-xs font-mono-medium text-danger">
                    {memberName ?? "selected member"}
                  </ThemedText>
                </ThemedText>
              )}
              {!!dateFrom && !!dateTo && (
                <ThemedText className="text-xs font-mono-medium">
                  {dateFrom ?? "…"} ➔ {dateTo ?? "…"}
                </ThemedText>
              )}
            </AnimatedView>
          )}
          <KoshContributionList
            items={items}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            loadMore={loadMore}
            refreshing={isRefetching}
            onRefresh={refetch}
          />
        </View>
      )}
    </View>
  );
};

export default AllContributionsScreen;
