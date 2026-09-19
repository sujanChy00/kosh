import { JoinRequestCard } from "@/components/join-request/join-request-card";
import { EmptyComponent } from "@/components/layout/empty-component";
import { ErrorComponent } from "@/components/layout/error-component";
import { ListSeparatorComponent } from "@/components/layout/list-separator-component";
import { PendingComponent } from "@/components/layout/pending-component";
import { useHaptics } from "@/hooks/use-haptics";
import { errorToast, successToast } from "@/utils/toast";
import { trpc } from "@/utils/trpc";
import type { KoshListItem } from "@kosh-app/api/routers/kosh";
import { LegendList } from "@legendapp/list/react-native";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useMemo } from "react";
import { Alert } from "react-native";

const MANAGER_ROLES: KoshListItem["role"][] = ["adhyaksh", "koshadhyaksh"];

type JoinRequestUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

type JoinRequestRow = {
  id: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string | Date;
  user: JoinRequestUser | null;
};

const formatRequestedAt = (value: string | Date) =>
  new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const JoinRequestsScreen = () => {
  const haptics = useHaptics();
  const { id: koshId } = useLocalSearchParams<{ id: string }>();

  const koshesQuery = useQuery(trpc.kosh.list.queryOptions({ limit: 100 }));
  const managedKoshes =
    koshesQuery.data?.items.filter((k) => MANAGER_ROLES.includes(k.role)) ?? [];

  // const activeKoshId = selectedKoshId ?? managedKoshes[0]?.id;

  const requestsQuery = useQuery(trpc.invite.requests.queryOptions({ koshId }));

  const reviewMutation = useMutation(
    trpc.invite.review.mutationOptions({
      onSuccess: (data) => {
        haptics("success");
        successToast({
          title:
            data.status === "approved"
              ? "Join request approved"
              : "Join request rejected",
        });
        // if (activeKoshId) {
        //   queryClient.invalidateQueries({
        //     queryKey: trpc.invite.requests.queryKey({ koshId: activeKoshId }),
        //   });
        // }
      },
      onError: (error) => {
        haptics("error");
        errorToast({
          title: error.message || "Failed to update the request",
        });
      },
    }),
  );

  const approve = (requestId: string) => {
    reviewMutation.mutate({ requestId, decision: "approved" });
  };

  const confirmReject = (requestId: string) => {
    Alert.alert("Reject request?", "This user won't be added to the kosh.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: () =>
          reviewMutation.mutate({ requestId, decision: "rejected" }),
      },
    ]);
  };

  const requests = useMemo(
    () => requestsQuery.data ?? [],
    [requestsQuery.data],
  );
  const pending = requests.filter((r) => r.status === "pending");
  const reviewed = requests.filter((r) => r.status !== "pending");

  const keyExtractor = useCallback(({ id }: KoshListItem) => id.toString(), []);
  const ListSeparator = useCallback(() => <ListSeparatorComponent />, []);
  const renderItem = useCallback(
    ({ item }: { item: KoshListItem }) => <JoinRequestCard kosh={item} />,
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
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
    />
  );
};

export default JoinRequestsScreen;
