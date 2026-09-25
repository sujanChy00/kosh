import { ListFetchingMoreComponent } from "@/components/layout/list-fetching-more-component";
import { ListSeparatorComponent } from "@/components/layout/list-separator-component";
import type { KoshLoanItem } from "@kosh-app/api/routers/loan";
import { LegendList } from "@legendapp/list/react-native";
import { useCallback } from "react";

import { KoshLoanCard } from "./kosh-loan-card";

interface KoshLoanListProps {
  items: KoshLoanItem[];
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  loadMore: () => void;
  refreshing: boolean;
  onRefresh: () => void;
  ListHeaderComponent?: React.JSX.Element | null;
}

export const KoshLoanList = ({
  items,
  isFetchingNextPage,
  hasNextPage,
  loadMore,
  refreshing,
  onRefresh,
  ListHeaderComponent,
}: KoshLoanListProps) => {
  const renderItem = useCallback(
    ({ item }: { item: KoshLoanItem }) => <KoshLoanCard item={item} />,
    [],
  );
  const keyExtractor = useCallback(({ id }: KoshLoanItem) => id.toString(), []);
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
      contentContainerClassName="p-2 pb-20"
      data={items}
      drawDistance={500}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ItemSeparatorComponent={ListSeparator}
      showsVerticalScrollIndicator={false}
      recycleItems
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListFooterComponent={ListFooterComponent}
      ListHeaderComponent={ListHeaderComponent}
      experimental_adaptiveRender={{
        enterVelocity: 6,
        exitVelocity: 3,
        exitDelay: 250,
      }}
    />
  );
};
