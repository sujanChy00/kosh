import PLUST_ICON from "@expo/material-symbols/add.xml";
import RECORD_ICON from "@expo/material-symbols/edit_square.xml";
import JOIN_ICON from "@expo/material-symbols/group_add.xml";
import { LegendList } from "@legendapp/list/react-native";
import type { KoshListItem } from "@kosh-app/api/routers/kosh";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { Avatar } from "@/components/ui/avatar";
import { OutlineButton, PrimaryButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { trpc } from "@/utils/trpc";

const PAGE_SIZE = 10;

const ROLE_LABELS: Record<KoshListItem["role"], string> = {
  adhyaksh: "Adhyaksh",
  koshadhyaksh: "Koshadhyaksh",
  sadasya: "Sadasya",
};

const formatAmount = (amount: string) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
    Number(amount),
  );

const KoshCard = ({ kosh }: { kosh: KoshListItem }) => {
  return (
    <Card className="gap-2">
      <Card.Body className="flex-row items-center gap-3">
        <Avatar>
          <Avatar.Image source={kosh.iconUrl ? { uri: kosh.iconUrl } : undefined} />
          <Avatar.Fallback source={kosh.iconUrl} fallback={kosh.name} />
        </Avatar>
        <View className="flex-1 gap-1">
          <Card.Title className="text-base">{kosh.name}</Card.Title>
          {kosh.description ? (
            <Card.Description className="text-sm" numberOfLines={1}>
              {kosh.description}
            </Card.Description>
          ) : null}
        </View>
      </Card.Body>
      <Card.Footer className="flex-row items-center justify-between">
        <ThemedText className="text-sm text-muted">
          {kosh.currency} {formatAmount(kosh.monthlyAmount)} / month
        </ThemedText>
        <View className="flex-row items-center gap-3">
          <ThemedText className="text-sm text-muted">
            {kosh.memberCount} {kosh.memberCount === 1 ? "member" : "members"}
          </ThemedText>
          <Chip variant="soft" color="primary" size="sm">
            <Chip.Label>{ROLE_LABELS[kosh.role]}</Chip.Label>
          </Chip>
        </View>
      </Card.Footer>
      <View className="mt-1 flex-row items-center justify-between">
        <View className="gap-0.5">
          <ThemedText className="text-xs text-muted">Total collected</ThemedText>
          <ThemedText className="font-medium">
            {kosh.currency} {formatAmount(kosh.totalCollected)}
          </ThemedText>
        </View>
        <View className="items-end gap-0.5">
          <ThemedText className="text-xs text-muted">In kosh now</ThemedText>
          <ThemedText className="font-medium">
            {kosh.currency} {formatAmount(kosh.totalRemaining)}
          </ThemedText>
        </View>
      </View>
    </Card>
  );
};

const KoshScreen = () => {
  const router = useRouter();

  const koshQuery = useInfiniteQuery(
    trpc.kosh.list.infiniteQueryOptions(
      { limit: PAGE_SIZE },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );

  const koshList = koshQuery.data?.pages.flatMap((page) => page.items) ?? [];

  const loadMore = () => {
    if (koshQuery.hasNextPage && !koshQuery.isFetchingNextPage) {
      koshQuery.fetchNextPage();
    }
  };

  return (
    <View className="flex-1">
      <Stack.Title>My Kosh</Stack.Title>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          variant="prominent"
          onPress={() => {
            router.push({ pathname: "/join" });
          }}
        >
          <Stack.Toolbar.Icon
            sf="person.crop.circle.badge.plus"
            src={JOIN_ICON}
          />
        </Stack.Toolbar.Button>
        <Stack.Toolbar.Button
          variant="prominent"
          onPress={() => {
            router.push({
              pathname: "/contribution",
            });
          }}
        >
          <Stack.Toolbar.Icon sf="pencil.and.list.clipboard" src={RECORD_ICON} />
        </Stack.Toolbar.Button>
        <Stack.Toolbar.Button
          variant="prominent"
          onPress={() => {
            router.push({
              pathname: "/kosh/add",
            });
          }}
        >
          <Stack.Toolbar.Icon sf="plus" src={PLUST_ICON} />
        </Stack.Toolbar.Button>
      </Stack.Toolbar>

      {koshQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : koshQuery.isError ? (
        <View className="flex-1 items-center justify-center gap-4 p-6">
          <ThemedText className="text-muted">
            Could not load your kosh.
          </ThemedText>
          <PrimaryButton onPress={() => koshQuery.refetch()}>
            <PrimaryButton.Label>Try again</PrimaryButton.Label>
          </PrimaryButton>
        </View>
      ) : (
        <LegendList
          data={koshList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/kosh/[id]",
                  params: { id: item.id, name: item.name, role: item.role },
                })
              }
            >
              <KoshCard kosh={item} />
            </Pressable>
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          estimatedItemSize={150}
          showsVerticalScrollIndicator={false}
          refreshing={koshQuery.isRefetching}
          onRefresh={koshQuery.refetch}
          contentContainerStyle={{
            flexGrow: 1,
            padding: 16,
            gap: 12,
          }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center gap-4 p-6">
              <ThemedText className="text-center text-muted">
                You are not part of any kosh yet. Create one to get started.
              </ThemedText>
              <PrimaryButton
                onPress={() => router.push({ pathname: "/kosh/add" })}
              >
                <PrimaryButton.Label>Create a kosh</PrimaryButton.Label>
              </PrimaryButton>
              <OutlineButton
                onPress={() => router.push({ pathname: "/join" })}
              >
                <OutlineButton.Label>Join a kosh</OutlineButton.Label>
              </OutlineButton>
            </View>
          }
          ListFooterComponent={
            koshQuery.isFetchingNextPage ? (
              <View className="py-4">
                <ActivityIndicator />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};

export default KoshScreen;