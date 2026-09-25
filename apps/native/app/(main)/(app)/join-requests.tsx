import { HorizontalKoshSelector } from "@/components/kosh/horizontal-kosh-selector";
import { ThemedText } from "@/components/themed-text";
import { Avatar } from "@/components/ui/avatar";
import { DangerButton, PrimaryButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { useHaptics } from "@/hooks/use-haptics";
import { errorToast, successToast } from "@/utils/toast";
import { queryClient, trpc } from "@/utils/trpc";
import type { KoshListItem } from "@kosh-app/api/routers/kosh";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, Alert, ScrollView, View } from "react-native";

const MANAGER_ROLES: KoshListItem["role"][] = ["adhyaksh", "koshadhyaksh"];

type JoinRequestUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

const formatRequestedAt = (value: string | Date) =>
  new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const JoinRequestsScreen = () => {
  const haptics = useHaptics();
  const { koshId, selectedKosh } = useLocalSearchParams<{
    koshId?: string;
    selectedKosh?: string;
  }>();

  const koshesQuery = useInfiniteQuery(
    trpc.kosh.list.infiniteQueryOptions(
      { limit: 10 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );

  const koshList = useMemo(() => {
    return koshesQuery?.data?.pages.flatMap((page) => page.items) ?? [];
  }, [koshesQuery?.data]);

  const managedKoshes =
    koshList.filter((k) => MANAGER_ROLES.includes(k.role)) ?? [];

  const activeKoshId = selectedKosh ?? managedKoshes[0]?.id;

  const requestsQuery = useQuery(
    trpc.invite.requests.queryOptions(
      { koshId: activeKoshId ?? "" },
      { enabled: activeKoshId != null },
    ),
  );

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
        if (activeKoshId) {
          queryClient.invalidateQueries({
            queryKey: trpc.invite.requests.queryKey({ koshId: activeKoshId }),
          });
        }
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

  const requests = requestsQuery.data ?? [];
  const pending = requests.filter((r) => r.status === "pending");
  const reviewed = requests.filter((r) => r.status !== "pending");

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerClassName="p-4 gap-4"
    >
      <Stack.Screen options={{ headerTitle: "Join requests" }} />

      <HorizontalKoshSelector koshList={managedKoshes} />

      {!activeKoshId ? (
        <Card>
          <Card.Body>
            <ThemedText className="text-muted">
              You don't manage any kosh yet.
            </ThemedText>
          </Card.Body>
        </Card>
      ) : requestsQuery.isLoading ? (
        <View className="items-center justify-center py-10">
          <ActivityIndicator />
        </View>
      ) : requestsQuery.isError ? (
        <Card>
          <Card.Body className="gap-3">
            <ThemedText className="text-muted">
              Could not load join requests.
            </ThemedText>
            <PrimaryButton onPress={() => requestsQuery.refetch()}>
              <PrimaryButton.Label>Try again</PrimaryButton.Label>
            </PrimaryButton>
          </Card.Body>
        </Card>
      ) : requests.length === 0 ? (
        <Card>
          <Card.Body>
            <ThemedText className="text-muted">
              No one has requested to join this kosh yet. Share an invite from
              the kosh details screen.
            </ThemedText>
          </Card.Body>
        </Card>
      ) : (
        <>
          {pending.length > 0 ? (
            <View className="gap-2">
              <ThemedText className="text-xs uppercase tracking-[0.2em] text-muted">
                Pending ({pending.length})
              </ThemedText>
              {pending.map((request) => (
                <Card key={request.id}>
                  <Card.Body className="flex-row items-center gap-3">
                    <Avatar>
                      <Avatar.Image
                        source={
                          request.user?.image
                            ? { uri: request.user.image }
                            : undefined
                        }
                      />
                      <Avatar.Fallback
                        source={request.user?.image ?? null}
                        fallback={request.user?.name ?? "?"}
                      />
                    </Avatar>
                    <View className="flex-1 gap-0.5">
                      <Card.Title className="text-base">
                        {request.user?.name ?? "Unknown member"}
                      </Card.Title>
                      {request.user?.email ? (
                        <Card.Description className="text-sm">
                          {request.user.email}
                        </Card.Description>
                      ) : null}
                      <ThemedText className="text-xs text-muted">
                        Requested {formatRequestedAt(request.requestedAt)}
                      </ThemedText>
                    </View>
                  </Card.Body>
                  <Card.Footer className="flex-row gap-2">
                    <PrimaryButton
                      className="flex-1"
                      onPress={() => approve(request.id)}
                      disabled={reviewMutation.isPending}
                    >
                      <PrimaryButton.Label>Approve</PrimaryButton.Label>
                    </PrimaryButton>
                    <DangerButton
                      className="flex-1"
                      onPress={() => confirmReject(request.id)}
                      disabled={reviewMutation.isPending}
                    >
                      <DangerButton.Label>Reject</DangerButton.Label>
                    </DangerButton>
                  </Card.Footer>
                </Card>
              ))}
            </View>
          ) : null}

          {reviewed.length > 0 ? (
            <View className="gap-2">
              <ThemedText className="text-xs uppercase tracking-[0.2em] text-muted">
                Reviewed
              </ThemedText>
              {reviewed.map((request) => (
                <Card key={request.id}>
                  <Card.Body className="flex-row items-center gap-3">
                    <Avatar>
                      <Avatar.Image
                        source={
                          request.user?.image
                            ? { uri: request.user.image }
                            : undefined
                        }
                      />
                      <Avatar.Fallback
                        source={request.user?.image ?? null}
                        fallback={request.user?.name ?? "?"}
                      />
                    </Avatar>
                    <View className="flex-1 gap-0.5">
                      <Card.Title className="text-base">
                        {request.user?.name ?? "Unknown member"}
                      </Card.Title>
                      {request.user?.email ? (
                        <Card.Description className="text-sm">
                          {request.user.email}
                        </Card.Description>
                      ) : null}
                      <ThemedText className="text-xs text-muted">
                        Requested {formatRequestedAt(request.requestedAt)}
                      </ThemedText>
                    </View>
                    <Chip
                      variant="soft"
                      color={
                        request.status === "approved" ? "success" : "danger"
                      }
                      size="md"
                    >
                      <Chip.Label>{request.status}</Chip.Label>
                    </Chip>
                  </Card.Body>
                </Card>
              ))}
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
};

export default JoinRequestsScreen;
