import type { MyContributionStats as MyContributionStatsType } from "@kosh-app/api/routers/contribution";
import { formatAmount } from "@kosh-app/utils";
import { View } from "react-native";
import { StyledSymbolView } from "../styled-symbol-view";
import { ThemedText } from "../themed-text";

interface MyContributionStatsProps {
  stats: MyContributionStatsType;
}

export const MyContributionStats = ({ stats }: MyContributionStatsProps) => {
  return (
    <View className={"gap-3"}>
      <View className="flex-row flex-wrap gap-3">
        <View className="flex-1 bg-surface p-4 rounded-2xl gap-y-1">
          <View className="flex-row items-center gap-2">
            <StyledSymbolView
              tintColorClassName="accent-primary"
              size={16}
              name={{ android: "payments" }}
            />
            <ThemedText className="text-xs text-muted-foreground uppercase font-mono-regular">
              Total Paid
            </ThemedText>
          </View>
          <ThemedText className="text-lg font-mono-semibold">
            रु {formatAmount(stats.totalPaid)}
          </ThemedText>
        </View>

        <View className="flex-1 bg-surface p-4 rounded-2xl gap-y-1">
          <View className="flex-row items-center gap-2">
            <StyledSymbolView
              tintColorClassName={
                Number(stats.unpaidDues) > 0 ? "accent-danger" : "accent-muted"
              }
              size={16}
              name={{ android: "account_balance_wallet" }}
            />
            <ThemedText className="text-xs text-muted-foreground uppercase font-mono-regular">
              Unpaid Dues
            </ThemedText>
          </View>
          <ThemedText
            className={`text-lg font-mono-semibold ${
              Number(stats.unpaidDues) > 0 ? "text-danger" : ""
            }`}
          >
            रु {formatAmount(stats.unpaidDues)}
          </ThemedText>
        </View>
      </View>
      <View className="flex-row flex-wrap gap-3">
        <View className="flex-1 bg-surface p-4 rounded-2xl gap-y-1">
          <View className="flex-row items-center gap-2">
            <StyledSymbolView
              tintColorClassName="accent-warning"
              size={16}
              name={{ android: "warning" }}
            />
            <ThemedText className="text-xs text-muted-foreground uppercase font-mono-regular">
              Penalties
            </ThemedText>
          </View>
          <ThemedText className="text-lg font-mono-semibold">
            रु {formatAmount(stats.totalPenaltiesPaid)}
          </ThemedText>
        </View>

        <View className="flex-1 bg-surface p-4 rounded-2xl gap-y-1">
          <View className="flex-row items-center gap-2">
            <StyledSymbolView
              tintColorClassName="accent-success"
              size={16}
              name={{ android: "check_circle" }}
            />
            <ThemedText className="text-xs text-muted-foreground uppercase font-mono-regular">
              Paid Periods
            </ThemedText>
          </View>
          <ThemedText className="text-lg font-mono-semibold">
            {stats.paidPeriodsCount}{" "}
            <ThemedText className="text-xs text-muted-foreground font-mono-regular">
              ({stats.pendingPeriodsCount} pending)
            </ThemedText>
          </ThemedText>
        </View>
      </View>
    </View>
  );
};
