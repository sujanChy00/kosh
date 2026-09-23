import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { Chip } from "../ui/chip";
import { Shimmer, ShimmerGroup } from "../ui/shimmer";

interface Props {
  koshList: { id: string; name: string }[];
  className?: string;
  isPending: boolean;
}

export const HorizontalKoshSelector = ({
  koshList,
  className,
  isPending,
}: Props) => {
  const router = useRouter();
  const { selectedKosh } = useLocalSearchParams<{ selectedKosh?: string }>();
  const onSelectKosh = (koshId: string | undefined) => {
    router.setParams({ selectedKosh: koshId });
  };

  if (isPending)
    return (
      <ShimmerGroup>
        <View className="flex-row items-center gap-3">
          <Shimmer className="h-8 w-22 rounded-3xl" />
          <Shimmer className="h-8 w-22 rounded-3xl" />
          <Shimmer className="h-8 w-22 rounded-3xl" />
        </View>
      </ShimmerGroup>
    );

  if (koshList.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-x-2 py-1"
    >
      <TouchableOpacity
        onPress={() => onSelectKosh(undefined)}
        activeOpacity={0.7}
      >
        <Chip
          variant={selectedKosh === undefined ? "primary" : "soft"}
          color={selectedKosh === undefined ? "primary" : "default"}
          size="md"
        >
          <Chip.Label className="font-mono-semibold">All</Chip.Label>
        </Chip>
      </TouchableOpacity>

      {koshList.map((kosh) => (
        <TouchableOpacity
          key={kosh.id}
          onPress={() => onSelectKosh(kosh.id)}
          activeOpacity={0.7}
        >
          <Chip
            variant={selectedKosh === kosh.id ? "primary" : "soft"}
            color={selectedKosh === kosh.id ? "primary" : "default"}
            size="md"
          >
            <Chip.Label className="font-mono-semibold">{kosh.name}</Chip.Label>
          </Chip>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};
