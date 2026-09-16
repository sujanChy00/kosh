import type { KoshDetail } from "@kosh-app/api/routers/kosh";
import { formatAmount, formatDueDay } from "@kosh-app/utils";
import { formatShortDate } from "@kosh-app/utils/date";
import { View } from "react-native";
import { ThemedText } from "../themed-text";
import { Separator } from "../ui/separator";

export const KoshDetailsContributionInfo = ({ kosh }: { kosh: KoshDetail }) => {
  return (
    <View className="gap-y-3">
      <View className="flex-row items-center justify-between gap-3">
        <ThemedText>Start date</ThemedText>
        <ThemedText className="font-mono-medium">
          {formatShortDate(new Date(kosh.startDate))}
        </ThemedText>
      </View>
      <Separator />
      <View className="flex-row items-center justify-between gap-3">
        <ThemedText>Monthly amount</ThemedText>
        <ThemedText className="font-mono-medium">
          रु {formatAmount(kosh.monthlyAmount)}
        </ThemedText>
      </View>
      <Separator />
      <View className="flex-row items-center justify-between gap-3">
        <ThemedText>Due date</ThemedText>
        <ThemedText className="font-mono-medium">
          {formatDueDay(kosh.dueDay)}
        </ThemedText>
      </View>
      <Separator />
      <View className="flex-row items-center justify-between gap-3">
        <ThemedText>Fund Period</ThemedText>
        <ThemedText className="font-mono-medium text-xs">
          {formatShortDate(new Date(kosh.startDate))} -{" "}
          {formatShortDate(new Date(kosh.endDate))}
        </ThemedText>
      </View>
      {!!kosh.latePenaltyAmount && (
        <>
          <Separator />
          <View className="flex-row items-center justify-between gap-3">
            <ThemedText>Late Penalty</ThemedText>
            <ThemedText className="font-mono-medium text-xs">
              रु {formatAmount(kosh.latePenaltyAmount)}{" "}
              {!!kosh.penaltyGraceDays &&
                `- ${kosh.penaltyGraceDays} days grace`}
            </ThemedText>
          </View>
        </>
      )}
    </View>
  );
};
