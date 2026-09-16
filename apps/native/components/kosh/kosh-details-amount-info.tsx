import type { KoshDetail } from "@kosh-app/api/routers/kosh";
import { formatAmount } from "@kosh-app/utils";
import { View } from "react-native";
import { ThemedText } from "../themed-text";

export const KoshDetailsAmountInfo = ({ kosh }: { kosh: KoshDetail }) => {
  return (
    <View className="flex-row justify-end gap-3">
      <View className="gap-y-2">
        <ThemedText className="text-muted text-xs">COLLECTED</ThemedText>
        <ThemedText className="text-lg text-muted">
          रु {""}
          <ThemedText className="font-mono-semibold text-4xl text-muted">
            {formatAmount(kosh.totalCollected)}
          </ThemedText>
        </ThemedText>
      </View>
      <View className="w-px h-full bg-background" />
      <View className="gap-y-2">
        <ThemedText className="text-muted text-xs">IN KOSH</ThemedText>
        <ThemedText className="text-lg">
          रु{" "}
          <ThemedText className="font-mono-semibold text-4xl">
            {formatAmount(kosh.totalRemaining)}
          </ThemedText>
        </ThemedText>
      </View>
    </View>
  );
};
