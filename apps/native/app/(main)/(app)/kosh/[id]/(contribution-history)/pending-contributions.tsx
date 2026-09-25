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

const PAGE_SIZE = 10;

const PendingContributionsScreen = () => {
  const { id: koshId } = useGlobalSearchParams<{
    id: string;
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
    trpc.contribution.pendingContributionsByKosh.infiniteQueryOptions(
      {
        koshId,
        limit: PAGE_SIZE,
      },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

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
        message={error?.message ?? "Failed to load pending contributions."}
      />
    );
  }

  return (
    <View className="flex-1 bg-background">
      {items.length === 0 ? (
        <EmptyComponent
          actionButtonOnPress={refetch}
          actionButtonContent={
            <ThemedText className="text-primary-foreground">
              Try again
            </ThemedText>
          }
          message={"No pending contributions found"}
          description={
            "Pending contribution records for this kosh will appear here."
          }
        />
      ) : (
        <KoshContributionList
          items={items}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          loadMore={loadMore}
          refreshing={isRefetching}
          onRefresh={refetch}
        />
      )}
    </View>
  );
};

export default PendingContributionsScreen;
