import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView } from "react-native";
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
      <Chip
        onPress={() => onSelectKosh(undefined)}
        variant={selectedKosh === undefined ? "primary" : "soft"}
        color={selectedKosh === undefined ? "primary" : "default"}
        size="md"
      >
        <Chip.Label className="font-mono-semibold">
          All Koshes ({koshList.length})
        </Chip.Label>
      </Chip>

      {koshList.map((kosh) => (
        <Chip
          key={kosh.id}
          onPress={() => onSelectKosh(kosh.id)}
          variant={selectedKosh === kosh.id ? "primary" : "soft"}
          color={selectedKosh === kosh.id ? "primary" : "default"}
          size="md"
        >
          <Chip.Label className="font-mono-semibold">{kosh.name}</Chip.Label>
        </Chip>
      ))}
    </ScrollView>
  );
};
