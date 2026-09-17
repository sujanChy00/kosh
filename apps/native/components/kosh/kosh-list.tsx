import { trpc } from "@/utils/trpc";
import type { KoshListItem } from "@kosh-app/api/routers/kosh";
import { LegendList } from "@legendapp/list/react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { ErrorComponent } from "../layout/error-component";
import { ListFetchingMoreComponent } from "../layout/list-fetching-more-component";
import { PendingComponent } from "../layout/pending-component";
import { KoshCard } from "./kosh-card";
import { KoshEmptyComponent } from "./kosh-empty-component";

const PAGE_SIZE = 10;

export const KoshList = () => {
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

  const renderItem = useCallback(
    ({ item }: { item: KoshListItem }) => <KoshCard kosh={item} />,
    [],
  );
  const keyExtractor = useCallback(({ id }: KoshListItem) => id.toString(), []);
  const ListFooterComponent = useCallback(
    () => (
      <ListFetchingMoreComponent
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
      />
    ),
    [isFetchingNextPage, hasNextPage],
  );

  if (isLoading) return <PendingComponent />;

  if (isError)
    return (
      <ErrorComponent
        message={error?.message ?? "Could not load your kosh."}
        refetch={refetch}
      />
    );

  if (koshList.length === 0) return <KoshEmptyComponent />;

  return (
    <LegendList
      maintainVisibleContentPosition
      contentContainerClassName="p-2"
      data={koshList}
      drawDistance={500}
      onEndReachedThreshold={0.5}
      onEndReached={loadMore}
      refreshing={isRefetching}
      onRefresh={refetch}
      estimatedItemSize={239.625}
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
  );
};
