import type { KoshDetail } from "@kosh-app/api/routers/kosh";
import { formatAmount } from "@kosh-app/utils";
import { View } from "react-native";
import { ThemedText } from "../themed-text";
import { Card } from "../ui/card";
import { Separator } from "../ui/separator";

interface Props {
  kosh: KoshDetail;
}

export const KoshFinancialStats = ({ kosh }: Props) => {
  const stats = kosh.stats ?? {
    totalPenaltyCollected: "0",
    totalInterestCollected: "0",
    totalLoanDistributed: "0",
    externalLoanDistributed: "0",
    externalLoanInterestCollected: "0",
    totalOutstandingLoans: "0",
  };

  return (
    <Card className="p-4 gap-y-3 bg-surface rounded-xl">
      <ThemedText className="font-notosans-semibold text-base text-foreground">
        Financial Overview
      </ThemedText>

      <Separator />

      <View className="flex-row items-center justify-between gap-3">
        <ThemedText className="text-muted-foreground text-sm">
          Total Penalty Collected
        </ThemedText>
        <ThemedText className="font-mono-semibold text-sm">
          रु {formatAmount(stats.totalPenaltyCollected)}
        </ThemedText>
      </View>

      <Separator />

      <View className="flex-row items-center justify-between gap-3">
        <ThemedText className="text-muted-foreground text-sm">
          Total Interest Collected
        </ThemedText>
        <ThemedText className="font-mono-semibold text-sm text-success">
          रु {formatAmount(stats.totalInterestCollected)}
        </ThemedText>
      </View>

      <Separator />

      <View className="flex-row items-center justify-between gap-3">
        <ThemedText className="text-muted-foreground text-sm">
          Total Loan Distributed
        </ThemedText>
        <ThemedText className="font-mono-semibold text-sm">
          रु {formatAmount(stats.totalLoanDistributed)}
        </ThemedText>
      </View>

      <Separator />

      <View className="flex-row items-center justify-between gap-3">
        <ThemedText className="text-muted-foreground text-sm">
          External Loan Distributed
        </ThemedText>
        <ThemedText className="font-mono-semibold text-sm text-primary">
          रु {formatAmount(stats.externalLoanDistributed)}
        </ThemedText>
      </View>

      <Separator />

      <View className="flex-row items-center justify-between gap-3">
        <ThemedText className="text-muted-foreground text-sm">
          External Interest Collected
        </ThemedText>
        <ThemedText className="font-mono-semibold text-sm text-success">
          रु {formatAmount(stats.externalLoanInterestCollected)}
        </ThemedText>
      </View>

      <Separator />

      <View className="flex-row items-center justify-between gap-3">
        <ThemedText className="text-muted-foreground text-sm">
          Total Outstanding Loans
        </ThemedText>
        <ThemedText className="font-mono-semibold text-sm text-warning">
          रु {formatAmount(stats.totalOutstandingLoans)}
        </ThemedText>
      </View>
    </Card>
  );
};
