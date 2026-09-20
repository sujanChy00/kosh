import { ThemedText } from "@/components/themed-text";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Separator } from "@/components/ui/separator";
import type { MemberContributionItem } from "@kosh-app/api/routers/membership";
import { formatAmount } from "@kosh-app/utils";
import { formatPeriodName, formatShortDate } from "@kosh-app/utils/date";
import { View } from "react-native";

export interface KoshMemberContributionDetailsProps {
  contributions: MemberContributionItem[];
}

export const KoshMemberContributionDetails = ({
  contributions,
}: KoshMemberContributionDetailsProps) => {
  if (contributions.length === 0) {
    return (
      <Card className="p-6 items-center justify-center">
        <ThemedText className="text-muted-foreground text-sm font-mono-regular">
          No contribution records found.
        </ThemedText>
      </Card>
    );
  }

  return (
    <View className="gap-y-2">
      {contributions.map((item) => (
        <Card key={item.id} className="p-3.5 gap-y-2">
          <View className="flex-row items-center justify-between">
            <ThemedText className="font-notosans-semibold text-base">
              {formatPeriodName(item.period)}
            </ThemedText>

            <Chip
              variant="soft"
              color={
                item.status === "paid"
                  ? "success"
                  : item.status === "late"
                    ? "warning"
                    : item.status === "partial"
                      ? "warning"
                      : "default"
              }
              size="sm"
            >
              <Chip.Label className="uppercase font-mono-semibold">
                {item.status}
              </Chip.Label>
            </Chip>
          </View>

          <Separator />

          <View className="flex-row justify-between items-center text-xs">
            <View>
              <ThemedText className="text-xs text-muted-foreground">
                Contribution Owed / Paid
              </ThemedText>
              <ThemedText className="font-mono-medium text-sm">
                रु {formatAmount(item.contributionAmount)} / रु{" "}
                {formatAmount(item.expectedAmount)}
              </ThemedText>
            </View>

            {Number(item.penaltyPaid) > 0 && (
              <View className="items-end">
                <ThemedText className="text-xs text-warning font-mono-regular">
                  Penalty Paid: रु {formatAmount(item.penaltyPaid)}
                </ThemedText>
              </View>
            )}
          </View>

          {item.datePaid && (
            <ThemedText className="text-muted text-xs font-mono-regular pt-1">
              Paid on {formatShortDate(new Date(item.datePaid))}
            </ThemedText>
          )}
        </Card>
      ))}
    </View>
  );
};
