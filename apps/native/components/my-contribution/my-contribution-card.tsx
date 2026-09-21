import type { MyContributionItem } from "@kosh-app/api/routers/contribution";
import { cn, formatAmount } from "@kosh-app/utils";
import { formatShortDate } from "@kosh-app/utils/date";
import { View } from "react-native";
import { ThemedText } from "../themed-text";
import { Avatar } from "../ui/avatar";
import { Card } from "../ui/card";
import { Separator } from "../ui/separator";
import { MyContributionStatusChip } from "./my-contribution-status-chip";

export const MyContributionCard = ({ item }: { item: MyContributionItem }) => {
  return (
    <Card className="p-4 gap-y-2.5">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-row items-center gap-2 flex-1 shrink">
          <Avatar className="size-8">
            <Avatar.Image source={item.koshIconUrl} alt={item.koshName} />
            <Avatar.Fallback
              className={"text-xs"}
              source={item.koshIconUrl}
              fallback={item.koshName}
            />
          </Avatar>
          <View className="flex-1 shrink">
            <ThemedText
              numberOfLines={1}
              className="font-notosans-semibold text-base"
            >
              {item.koshName}
            </ThemedText>
            <ThemedText className="text-xs text-muted-foreground font-mono-regular">
              {item.periodLabel}
            </ThemedText>
          </View>
        </View>

        <MyContributionStatusChip status={item.status} />
      </View>

      <Separator />

      <View className="flex-row justify-between items-center text-xs">
        <View>
          <ThemedText className="text-xs text-muted-foreground">
            Contribution Paid / Expected
          </ThemedText>
          <ThemedText className="font-mono-semibold text-sm">
            रु {formatAmount(item.contributionAmount)} / रु{" "}
            {formatAmount(item.expectedAmount)}
          </ThemedText>
        </View>
      </View>

      {Number(item.penaltyAssessed) > Number(item.penaltyPaid) && (
        <View className="flex-row items-center gap-3 justify-between">
          <View>
            <ThemedText className="text-xs text-danger font-mono-regular">
              Penalty Owed
            </ThemedText>
            <ThemedText className="text-xs text-danger font-mono-semibold">
              रु{" "}
              {formatAmount(
                String(Number(item.penaltyAssessed) - Number(item.penaltyPaid)),
              )}
            </ThemedText>
          </View>
          <View>
            <ThemedText
              className={cn(
                "text-xs font-mono-regular text-right",
                item.status === "paid" ? "text-success" : "text-warning",
              )}
            >
              Penalty Paid
            </ThemedText>
            <ThemedText
              className={cn(
                "text-xs font-mono-regular text-right",
                item.status === "paid" ? "text-success" : "text-warning",
              )}
            >
              रु {formatAmount(item.penaltyPaid ?? "0")}
            </ThemedText>
          </View>
        </View>
      )}
      {item.datePaid && (
        <ThemedText className="text-muted text-xs font-mono-regular text-right">
          Paid on {formatShortDate(new Date(item.datePaid))}
        </ThemedText>
      )}
    </Card>
  );
};
