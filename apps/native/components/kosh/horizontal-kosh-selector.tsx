import { trpc } from "@/utils/trpc";
import { KoshListItem } from "@kosh-app/api/routers/kosh";
import { LegendList } from "@legendapp/list/react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { TouchableOpacity, View } from "react-native";
import { Chip } from "../ui/chip";
import { Shimmer, ShimmerGroup } from "../ui/shimmer";

export const HorizontalKoshSelector = () => {
  const router = useRouter();
  const { selectedKosh } = useLocalSearchParams<{ selectedKosh?: string }>();

  const { data, isPending, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      ...trpc.kosh.list.infiniteQueryOptions(
        { limit: 15 },
        {
          getNextPageParam: (lastPage) => lastPage.nextCursor,
        },
      ),
    });

  const koshList = useMemo(() => {
    return data?.pages.flatMap((page) => page.items) ?? [];
  }, [data]);

  const onSelectKosh = useCallback(
    (koshId: string) => {
      router.setParams({ selectedKosh: koshId === "all" ? undefined : koshId });
    },
    [router],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const keyExtractor = useCallback((item: KoshListItem) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: KoshListItem }) => {
      const isSelected =
        item.id === "all"
          ? selectedKosh === undefined
          : selectedKosh === item.id;

      return (
        <TouchableOpacity
          onPress={() => onSelectKosh(item.id)}
          activeOpacity={0.7}
        >
          <Chip
            variant={isSelected ? "primary" : "soft"}
            color={isSelected ? "primary" : "default"}
            size="md"
          >
            <Chip.Label className="font-mono-semibold">{item.name}</Chip.Label>
          </Chip>
        </TouchableOpacity>
      );
    },
    [selectedKosh, onSelectKosh],
  );

  if (isPending) {
    return (
      <ShimmerGroup>
        <View className="flex-row items-center gap-3">
          <Shimmer className="h-8 w-22 rounded-3xl" />
          <Shimmer className="h-8 w-22 rounded-3xl" />
          <Shimmer className="h-8 w-22 rounded-3xl" />
        </View>
      </ShimmerGroup>
    );
  }

  if (koshList.length <= 1) return null;

  return (
    <LegendList
      horizontal
      data={koshList}
      recycleItems
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-x-2 py-1"
    />
  );
};
