import type { KoshContributionHistoryItem } from "@kosh-app/api/routers/contribution";
import { LegendList } from "@legendapp/list/react-native";
import { useCallback } from "react";
import { ListFetchingMoreComponent } from "../layout/list-fetching-more-component";
import { ListSeparatorComponent } from "../layout/list-separator-component";
import { KoshContributionCard } from "./kosh-contribution-card";

interface Props {
  items: KoshContributionHistoryItem[];
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  loadMore: () => void;
  refreshing: boolean;
  onRefresh: () => void;
}

export const KoshContributionList = ({
  items,
  isFetchingNextPage,
  hasNextPage,
  loadMore,
  refreshing,
  onRefresh,
}: Props) => {
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
    <LegendList
      maintainVisibleContentPosition
      contentContainerClassName="p-4 pb-safe-offset-20"
      data={items}
      drawDistance={500}
      onEndReachedThreshold={0.5}
      onEndReached={loadMore}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ItemSeparatorComponent={ListSeparator}
      estimatedItemSize={160}
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
