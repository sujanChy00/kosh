import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, TouchableOpacity } from "react-native";
import { Chip } from "../ui/chip";

interface Props {
  koshList: { id: string; name: string }[];
  className?: string;
}

export const HorizontalKoshSelector = ({ koshList, className }: Props) => {
  const router = useRouter();
  const { selectedKosh } = useLocalSearchParams<{ selectedKosh?: string }>();
  const onSelectKosh = (koshId: string | undefined) => {
    router.setParams({ selectedKosh: koshId });
  };

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
          <Chip.Label className="font-mono-semibold">
            All Koshes ({koshList.length})
          </Chip.Label>
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
