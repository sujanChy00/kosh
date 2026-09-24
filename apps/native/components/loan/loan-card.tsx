import { ThemedText } from "@/components/themed-text";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Separator } from "@/components/ui/separator";
import { loanStatusColor } from "@/lib/loan-status-color";
import { LinearProgressIndicator } from "@expo/ui/jetpack-compose";
import type { MyLoanItem } from "@kosh-app/api/routers/loan";
import { formatAmount } from "@kosh-app/utils";
import { formatShortDate } from "@kosh-app/utils/date";
import { View } from "react-native";
import { useCSSVariable } from "uniwind";
import { Host } from "../layout/host";

function progressPercent(principal: string, remaining: string) {
  const p = parseFloat(principal);
  const r = parseFloat(remaining);

  if (!p || p <= 0) return 0;

  return Math.min(1, Math.max(0, (p - r) / p));
}

export const LoanCard = ({ item }: { item: MyLoanItem }) => {
  const successColor = useCSSVariable("--color-success") as string;
  const isPending =
    item.status === "pending_adhyaksh" ||
    item.status === "pending_koshadhyaksh";
  const isPaidOff = item.status === "paid_off";
  const isDefaulted = item.status === "defaulted";
  const pct = progressPercent(item.principal, item.amountRemaining);

  if (isPending) {
    return (
      <Card className="p-4 gap-y-3">
        {/* Header Row */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2 flex-1 shrink">
            <Avatar className="size-9 rounded-2xl">
              <Avatar.Image source={item.koshIconUrl} alt={item.koshName} />
              <Avatar.Fallback
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
                Requested {formatShortDate(new Date(item.createdAt))}
              </ThemedText>
            </View>
          </View>

          <Chip variant="soft" color="warning" size="sm">
            <Chip.Label className="uppercase font-mono-semibold">
              Pending
            </Chip.Label>
          </Chip>
        </View>

        <Separator />

        {/* Details */}
        <View className="gap-y-2">
          <View className="flex-row justify-between items-center">
            <ThemedText className="text-xs text-muted-foreground font-mono-regular">
              Requested Amount
            </ThemedText>
            <ThemedText className="font-mono-semibold text-base text-warning">
              रु {formatAmount(item.amountRequested ?? item.principal)}
            </ThemedText>
          </View>

          {item.note && (
            <View className="gap-y-1 mt-1 bg-surface-secondary p-2.5 rounded-lg">
              <ThemedText className="text-xs font-mono-semibold text-muted-foreground">
                Note
              </ThemedText>
              <ThemedText className="text-xs font-notosans-regular">
                {item.note}
              </ThemedText>
            </View>
          )}
        </View>
      </Card>
    );
  }

  return (
    <Card className="p-4 gap-y-3">
      {/* Header Row */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2 flex-1 shrink">
          <Avatar className="size-9 rounded-2xl">
            <Avatar.Image source={item.koshIconUrl} alt={item.koshName} />
            <Avatar.Fallback
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
              Issued {formatShortDate(new Date(`${item.issueDate}T00:00:00`))}
            </ThemedText>
          </View>
        </View>

        <Chip variant="soft" color={loanStatusColor(item.status)} size="sm">
          <Chip.Label className="uppercase font-mono-semibold">
            {item.status === "paid_off"
              ? "Paid Off"
              : item.status === "defaulted"
                ? "Defaulted"
                : "Active"}
          </Chip.Label>
        </Chip>
      </View>

      <Separator />

      {/* Amount Rows */}
      <View className="gap-y-2">
        <View className="flex-row justify-between items-center">
          <ThemedText className="text-xs text-muted-foreground font-mono-regular">
            Principal
          </ThemedText>
          <ThemedText className="font-mono-semibold text-sm">
            रु {formatAmount(item.principal)}
          </ThemedText>
        </View>

        {!isPaidOff && (
          <View className="flex-row justify-between items-center">
            <ThemedText className="text-xs text-muted-foreground font-mono-regular">
              Monthly Interest
            </ThemedText>
            <ThemedText className="font-mono-semibold text-sm">
              रु {formatAmount(item.monthlyInterestAmount)} / mo
            </ThemedText>
          </View>
        )}

        {!isPaidOff && (
          <View className="flex-row justify-between items-center">
            <ThemedText
              className={`text-xs font-mono-regular ${isDefaulted ? "text-danger" : "text-muted-foreground"}`}
            >
              Remaining
            </ThemedText>
            <ThemedText
              className={`font-mono-semibold text-sm ${isDefaulted ? "text-danger" : ""}`}
            >
              रु {formatAmount(item.amountRemaining)}
            </ThemedText>
          </View>
        )}

        <View className="flex-row justify-between items-center">
          <ThemedText className="text-xs text-muted-foreground font-mono-regular">
            Repaid
          </ThemedText>
          <ThemedText className="font-mono-semibold text-sm text-success">
            रु {formatAmount(item.totalRepaid)}
          </ThemedText>
        </View>

        {Number(item.totalInterestPaid) > 0 && (
          <View className="flex-row justify-between items-center">
            <ThemedText className="text-xs text-muted-foreground font-mono-regular">
              Interest Paid
            </ThemedText>
            <ThemedText className="font-mono-regular text-xs text-muted-foreground">
              रु {formatAmount(item.totalInterestPaid)}
            </ThemedText>
          </View>
        )}
      </View>
      {!isPaidOff && (
        <Host matchContents={{ vertical: true }}>
          <LinearProgressIndicator
            progress={pct}
            color={successColor}
            gapSize={0}
            drawStopIndicator={{
              stopSize: 0,
            }}
          />
        </Host>
      )}

      <View className="flex-row items-center justify-between">
        <ThemedText className="text-xs text-muted-foreground font-mono-regular">
          {item.monthlyInterestRate}% / mo ({item.yearlyInterestRate}% / yr)
        </ThemedText>
        {item.dueDate && !isPaidOff && (
          <ThemedText className="text-xs text-muted-foreground font-mono-regular">
            Due {formatShortDate(new Date(`${item.dueDate}T00:00:00`))}
          </ThemedText>
        )}
      </View>
    </Card>
  );
};
