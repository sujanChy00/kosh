import type { MyContributionStats as MyContributionStatsType } from "@kosh-app/api/routers/contribution";
import { formatAmount } from "@kosh-app/utils";
import { View } from "react-native";
import { StyledSymbolView } from "../styled-symbol-view";
import { ThemedText } from "../themed-text";

interface MyContributionStatsProps {
  stats: MyContributionStatsType | undefined;
  isPending: boolean;
}

export const MyContributionStats = ({
  stats,
  isPending,
}: MyContributionStatsProps) => {
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
            {isPending ? "..." : "रु " + formatAmount(stats?.totalPaid ?? "0")}
          </ThemedText>
        </View>

        <View className="flex-1 bg-surface p-4 rounded-2xl gap-y-1">
          <View className="flex-row items-center gap-2">
            <StyledSymbolView
              tintColorClassName={
                Number(stats?.unpaidDues ?? "0") > 0
                  ? "accent-danger"
                  : "accent-muted"
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
              Number(stats?.unpaidDues ?? "0") > 0 ? "text-danger" : ""
            }`}
          >
            {isPending ? "..." : `रु ${formatAmount(stats?.unpaidDues ?? "0")}`}
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
            {isPending
              ? "..."
              : `रु ${formatAmount(stats?.totalPenaltiesPaid ?? "0")}`}
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
            {isPending ? "..." : stats?.paidPeriodsCount}{" "}
            {!isPending && (
              <ThemedText className="text-xs text-muted-foreground font-mono-regular">
                ({stats?.pendingPeriodsCount ?? 0} pending)
              </ThemedText>
            )}
          </ThemedText>
        </View>
      </View>
    </View>
  );
};
