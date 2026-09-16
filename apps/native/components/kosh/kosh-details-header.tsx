import { KoshDetail } from "@kosh-app/api/routers/kosh";
import { View } from "react-native";
import { ThemedText } from "../themed-text";
import { Avatar } from "../ui/avatar";
import { Chip } from "../ui/chip";

export const KoshDetailsHeader = ({ kosh }: { kosh: KoshDetail }) => {
  return (
    <View className="gap-y-1 w-full">
      <View className="flex-row gap-2 items-center w-full">
        <Avatar className="size-16">
          <Avatar.Image source={kosh.iconUrl} alt={kosh.name} />
          <Avatar.Fallback source={kosh.iconUrl} fallback={kosh.name} />
        </Avatar>
        <View className="flex-1 shrink">
          <ThemedText
            numberOfLines={1}
            ellipsizeMode="tail"
            className="text-2xl font-notosans-semibold capitalize"
          >
            {kosh.name}
          </ThemedText>
          <View className="flex-row items-center gap-1">
            <ThemedText className="text-gray-300">
              {kosh.memberCount} members ·
            </ThemedText>
            <Chip variant="soft" color="warning" size="sm">
              <Chip.Label className="uppercase font-mono-medium">
                {kosh.role}
              </Chip.Label>
            </Chip>
          </View>
        </View>
      </View>
      {kosh.description && (
        <ThemedText className="text-muted-foreground text-xs">
          {kosh.description}
        </ThemedText>
      )}
    </View>
  );
};
