import { trpc } from "@/utils/trpc";
import { useMaterialColors } from "@expo/ui/jetpack-compose";
import type { KoshMember } from "@kosh-app/api/routers/kosh";
import { useQuery } from "@tanstack/react-query";
import { useGlobalSearchParams } from "expo-router";
import { useCallback, useMemo } from "react";
import { FlatList, TouchableOpacity, View } from "react-native";
import { ZoomIn, ZoomOut } from "react-native-reanimated";
import { AnimatedView } from "../animated-view";
import { StyledSymbolView } from "../styled-symbol-view";
import { ThemedText } from "../themed-text";
import { Avatar } from "../ui/avatar";
import { Shimmer, ShimmerGroup } from "../ui/shimmer";

interface Props {
  memberId: string | undefined;
  onSelect: (memberId: string) => void;
}

export const KoshMemberSelector = ({ memberId, onSelect }: Props) => {
  const materialColor = useMaterialColors();
  const { id: koshId } = useGlobalSearchParams<{
    id: string;
    memberId?: string;
  }>();

  const membersQuery = useQuery(
    trpc.kosh.members.queryOptions({ koshId }, { enabled: !!koshId }),
  );
  const memberOptions = useMemo(
    () =>
      (membersQuery?.data?.filter((m) => !m.isNonMember) as KoshMember[]) ?? [],
    [membersQuery.data],
  );

  const renderItem = useCallback(
    ({ item }: { item: KoshMember }) => (
      <TouchableOpacity activeOpacity={0.7} onPress={() => onSelect(item.id)}>
        <View className="flex-row items-center gap-1 justify-between p-3">
          <View className="flex-row items-center gap-3">
            <Avatar>
              <Avatar.Image alt={item.name} source={item.image} />
              <Avatar.Fallback fallback={item.name} source={item.image} />
            </Avatar>

            <ThemedText>{item.name}</ThemedText>
          </View>
          <View
            className="items-center justify-center size-6 rounded-full border-2"
            style={{
              borderColor: materialColor.primary,
            }}
          >
            {memberId === item.id && (
              <AnimatedView
                entering={ZoomIn.duration(200)}
                exiting={ZoomOut.duration(300)}
                className="size-3.5 rounded-full"
                style={{
                  backgroundColor: materialColor.primary,
                }}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    ),
    [memberId],
  );

  const ListEmptyComponent = useMemo(
    () => (
      <View className="p-4 pt-10 items-center gap-1">
        <StyledSymbolView
          tintColorClassName="accent-warning"
          name={{
            android: "info",
          }}
        />
        <ThemedText className="text-center text-base font-notosans-medium-italic">
          No members found
        </ThemedText>
      </View>
    ),
    [],
  );

  if (membersQuery.isPending)
    return (
      <ShimmerGroup>
        <View className="gap-y-3 p-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <View
              key={index}
              className="flex-row items-center justify-between gap-3"
            >
              <View className="flex-row items-center gap-3 flex-1 shrink">
                <Shimmer className="size-10 rounded-full" />
                <View className="gap-y-1 flex-1 shrink">
                  <Shimmer className="w-[80%] h-2" />
                  <Shimmer className="w-[40%] h-2" />
                </View>
              </View>
              <Shimmer className="size-6 rounded-full" />
            </View>
          ))}
        </View>
      </ShimmerGroup>
    );

  return (
    <FlatList
      showsVerticalScrollIndicator={false}
      contentContainerClassName="px-4 pb-20"
      data={memberOptions}
      nestedScrollEnabled
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListEmptyComponent={ListEmptyComponent}
    />
  );
};
