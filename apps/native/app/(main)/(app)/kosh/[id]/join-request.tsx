import { JoinRequestCard } from "@/components/join-request/join-request-card";
import { EmptyComponent } from "@/components/layout/empty-component";
import { ErrorComponent } from "@/components/layout/error-component";
import { ListSeparatorComponent } from "@/components/layout/list-separator-component";
import { PendingComponent } from "@/components/layout/pending-component";
import { trpc } from "@/utils/trpc";
import type { JoinRequest } from "@kosh-app/api/routers/invite";
import { LegendList } from "@legendapp/list/react-native";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useMemo } from "react";

const JoinRequestsScreen = () => {
  const { id: koshId } = useLocalSearchParams<{ id: string }>();
  const requestsQuery = useQuery(trpc.invite.requests.queryOptions({ koshId }));

  const requests = useMemo(
    () => requestsQuery.data ?? [],
    [requestsQuery.data],
  );

  const keyExtractor = useCallback(({ id }: JoinRequest) => id.toString(), []);
  const ListSeparator = useCallback(() => <ListSeparatorComponent />, []);
  const renderItem = useCallback(
    ({ item }: { item: JoinRequest }) => <JoinRequestCard request={item} />,
    [],
  );

  if (requestsQuery.isLoading) return <PendingComponent />;

  if (requestsQuery.isError)
    return (
      <ErrorComponent
        message={requestsQuery.error?.message}
        refetch={requestsQuery.refetch}
      />
    );

  if (requests.length === 0)
    return (
      <EmptyComponent
        message="There are no requests for this kosh"
        description="No one has requested to join this kosh yet. Share an invite from
    the kosh details screen."
      />
    );

  return (
    <LegendList
      ItemSeparatorComponent={ListSeparator}
      recycleItems
      onRefresh={requestsQuery.refetch}
      refreshing={requestsQuery.isRefetching}
      contentContainerClassName="p-2"
      contentInsetAdjustmentBehavior="automatic"
      data={requests}
      showsVerticalScrollIndicator={false}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
    />
  );
};

export default JoinRequestsScreen;
