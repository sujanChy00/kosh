import type { LoanStats as LoanStatsType } from "@kosh-app/api/routers/loan";
import { cn, formatAmount } from "@kosh-app/utils";
import { View } from "react-native";
import { StyledSymbolView } from "../styled-symbol-view";
import { ThemedText } from "../themed-text";

interface LoanStatsProps {
  stats: LoanStatsType | undefined;
  isPending: boolean;
}

export const LoanStats = ({ stats, isPending }: LoanStatsProps) => {
  const activeLoanCount = stats?.activeLoanCount ?? 0;

  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-3">
        <View className="flex-1 bg-surface p-4 rounded-2xl gap-y-1">
          <View className="flex-row items-center gap-2">
            <StyledSymbolView
              tintColorClassName={
                activeLoanCount > 0 ? "accent-warning" : "accent-muted"
              }
              size={16}
              name={{ android: "payments" }}
            />
            <ThemedText className="text-xs text-muted-foreground uppercase font-mono-regular">
              Active Loans
            </ThemedText>
          </View>
          <ThemedText
            className={cn(
              "text-lg font-mono-semibold",
              activeLoanCount > 0 ? "text-warning" : "",
            )}
          >
            {isPending ? "..." : activeLoanCount}
          </ThemedText>
        </View>

        <View className="flex-1 bg-surface p-4 rounded-2xl gap-y-1">
          <View className="flex-row items-center gap-2">
            <StyledSymbolView
              tintColorClassName={
                Number(stats?.totalRemaining) > 0
                  ? "accent-danger"
                  : "accent-muted"
              }
              size={16}
              name={{ android: "account_balance_wallet" }}
            />
            <ThemedText className="text-xs text-muted-foreground uppercase font-mono-regular">
              Outstanding
            </ThemedText>
          </View>
          <ThemedText
            className={`text-lg font-mono-semibold ${Number(stats?.totalRemaining) > 0 ? "text-danger" : ""}`}
          >
            {isPending
              ? "..."
              : ` रु ${formatAmount(stats?.totalRemaining ?? "0")}`}
          </ThemedText>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-3">
        <View className="flex-1 bg-surface p-4 rounded-2xl gap-y-1">
          <View className="flex-row items-center gap-2">
            <StyledSymbolView
              tintColorClassName="accent-primary"
              size={16}
              name={{ android: "currency_rupee" }}
            />
            <ThemedText className="text-xs text-muted-foreground uppercase font-mono-regular">
              Total Borrowed
            </ThemedText>
          </View>
          <ThemedText className="text-lg font-mono-semibold">
            {isPending
              ? "..."
              : `रु ${formatAmount(stats?.totalBorrowed ?? "0")}`}
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
              Total Repaid
            </ThemedText>
          </View>
          <ThemedText className="text-lg font-mono-semibold">
            {isPending
              ? "..."
              : `रु ${formatAmount(stats?.totalRepaid ?? "0")}`}
          </ThemedText>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-3">
        <View className="flex-1 bg-surface p-4 rounded-2xl gap-y-1">
          <View className="flex-row items-center gap-2">
            <StyledSymbolView
              tintColorClassName="accent-warning"
              size={16}
              name={{ android: "percent" }}
            />
            <ThemedText className="text-xs text-muted-foreground uppercase font-mono-regular">
              Total Interest Paid
            </ThemedText>
          </View>
          <ThemedText className="text-lg font-mono-semibold">
            {isPending
              ? "..."
              : `रु ${formatAmount(stats?.totalInterestPaid ?? "0")}`}
          </ThemedText>
        </View>
      </View>
    </View>
  );
};
