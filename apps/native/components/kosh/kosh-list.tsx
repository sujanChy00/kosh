import { trpc } from "@/utils/trpc";
import type { KoshListItem } from "@kosh-app/api/routers/kosh";
import { LegendList } from "@legendapp/list/react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { ErrorComponent } from "../layout/error-component";
import { ListFetchingMoreComponent } from "../layout/list-fetching-more-component";
import { ListSeparatorComponent } from "../layout/list-separator-component";
import { KoshCard } from "./kosh-card";
import { KoshCardSkeleton } from "./kosh-card-skeleton";
import { KoshEmptyComponent } from "./kosh-empty-component";

const PAGE_SIZE = 10;
const keyExtractor = ({ id }: KoshListItem) => id.toString();
const ListSeparator = () => <ListSeparatorComponent />;

export const KoshList = () => {
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
    trpc.kosh.list.infiniteQueryOptions(
      { limit: PAGE_SIZE },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );

  const koshList = useMemo(() => {
    return data?.pages.flatMap((page) => page.items) ?? [];
  }, [data]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const renderItem = useCallback(
    ({ item }: { item: KoshListItem }) => (
      <KoshCard
        kosh={item}
        className="bg-surface rounded-3xl shadow overflow-hidden"
      />
    ),
    [],
  );

  const ListFooterComponent = useCallback(
    () => (
      <ListFetchingMoreComponent
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
      />
    ),
    [isFetchingNextPage, hasNextPage],
  );

  const ListEmptyComponent = useCallback(() => {
    if (isPending)
      return (
        <KoshCardSkeleton
          className="bg-surface rounded-3xl shadow overflow-hidden"
          wrapperClassName="p-2"
        />
      );
    if (isError)
      return (
        <ErrorComponent
          refetch={handleRefresh}
          message={error?.message ?? "Failed to load"}
        />
      );
    return <KoshEmptyComponent className="pt-14" />;
  }, [isPending, isError, error]);

  return (
    <LegendList
      maintainVisibleContentPosition
      contentContainerClassName="p-2"
      data={koshList}
      drawDistance={500}
      onEndReachedThreshold={0.5}
      onEndReached={loadMore}
      refreshing={isRefetching}
      onRefresh={handleRefresh}
      ItemSeparatorComponent={ListSeparator}
      estimatedItemSize={110.25}
      showsVerticalScrollIndicator={false}
      recycleItems
      ListEmptyComponent={ListEmptyComponent}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListFooterComponent={ListFooterComponent}
      experimental_adaptiveRender={{
        enterVelocity: 6,
        exitVelocity: 3,
        exitDelay: 250,
      }}
    />
  );
};
