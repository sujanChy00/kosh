import { EmptyComponent } from "@/components/layout/empty-component";
import { ErrorComponent } from "@/components/layout/error-component";
import { PendingComponent } from "@/components/layout/pending-component";
import { KoshLoanList } from "@/components/loan/kosh-loan-list";
import { trpc } from "@/utils/trpc";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useGlobalSearchParams } from "expo-router";
import { useCallback, useMemo } from "react";

const PAGE_SIZE = 10;

const PaidLoanScreen = () => {
  const { id: koshId } = useGlobalSearchParams<{ id: string }>();

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
    trpc.loan.paidLoansByKosh.infiniteQueryOptions(
      { koshId, limit: PAGE_SIZE },
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

  if (isLoading) return <PendingComponent />;

  if (isError) {
    return (
      <ErrorComponent
        refetch={refetch}
        message={error?.message ?? "Failed to load paid loans."}
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyComponent
        message="No paid loans"
        description="Cleared loans for this kosh will appear here."
      />
    );
  }

  return (
    <KoshLoanList
      items={items}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
      loadMore={loadMore}
      refreshing={isRefetching}
      onRefresh={refetch}
    />
  );
};

export default PaidLoanScreen;