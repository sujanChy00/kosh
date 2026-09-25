import type { KoshContributionHistoryItem } from "@kosh-app/api/routers/contribution";
import { cn, formatAmount } from "@kosh-app/utils";
import { formatShortDate } from "@kosh-app/utils/date";
import { View } from "react-native";
import { MyContributionStatusChip } from "../my-contribution/my-contribution-status-chip";
import { ThemedText } from "../themed-text";
import { Avatar } from "../ui/avatar";
import { Card } from "../ui/card";
import { Separator } from "../ui/separator";

export const KoshContributionCard = ({
  item,
}: {
  item: KoshContributionHistoryItem;
}) => {
  const penaltyOwed = Number(item.penaltyAssessed) - Number(item.penaltyPaid);

  return (
    <Card className="p-4 gap-y-2.5">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-row items-center gap-2.5 flex-1 shrink">
          <Avatar className="size-9">
            <Avatar.Image source={item.memberImage} alt={item.memberName ?? "Member"} />
            <Avatar.Fallback
              className="text-xs font-notosans-medium"
              source={item.memberImage}
              fallback={item.memberName ?? "Member"}
            />
          </Avatar>
          <View className="flex-1 shrink">
            <ThemedText
              numberOfLines={1}
              className="font-notosans-semibold text-base"
            >
              {item.memberName ?? "Unknown Member"}
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

      {(penaltyOwed > 0 || Number(item.penaltyPaid) > 0) && (
        <View className="flex-row items-center gap-3 justify-between">
          {penaltyOwed > 0 ? (
            <View>
              <ThemedText className="text-xs text-danger font-mono-regular">
                Penalty Owed
              </ThemedText>
              <ThemedText className="text-xs text-danger font-mono-semibold">
                रु {formatAmount(String(penaltyOwed))}
              </ThemedText>
            </View>
          ) : <View />}
          {Number(item.penaltyPaid) > 0 && (
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
                रु {formatAmount(item.penaltyPaid)}
              </ThemedText>
            </View>
          )}
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
