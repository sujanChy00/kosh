import { ThemedText } from "@/components/themed-text";
import { memo } from "react";
import { View } from "react-native";

import type { ChatListEntry } from "@kosh-app/utils";
import { formatDayLabel } from "@kosh-app/utils";

type DateEntry = Extract<ChatListEntry, { kind: "date" }>;

function DateSeparatorImpl({ entry }: { entry: DateEntry }) {
  return (
    <View className="items-center py-3">
      <View className="px-3 py-1 rounded-full bg-surface-secondary">
        <ThemedText className="text-muted-foreground text-[11px] font-notosans-medium">
          {formatDayLabel(entry.dayStart)}
        </ThemedText>
      </View>
    </View>
  );
}

export const DateSeparator = memo(DateSeparatorImpl);
