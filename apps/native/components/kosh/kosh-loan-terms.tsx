import type { KoshDetail } from "@kosh-app/api/routers/kosh";
import { formatAmount } from "@kosh-app/utils";
import { View } from "react-native";
import { ThemedText } from "../themed-text";
import { Separator } from "../ui/separator";

export const KoshLoanTerms = ({ kosh }: { kosh: KoshDetail }) => {
  return (
    <View className="gap-y-3">
      <View className="flex-row items-center justify-between gap-3">
        <ThemedText>Loan cap</ThemedText>
        <ThemedText className="font-mono-medium">
          रु {formatAmount(kosh.loanCap)}
        </ThemedText>
      </View>
      <Separator />
      <View className="flex-row items-center justify-between gap-3">
        <ThemedText>Member interest rate</ThemedText>
        <ThemedText className="font-mono-medium">
          {formatAmount(kosh.memberInterestRate)}%
        </ThemedText>
      </View>
      <Separator />
      <View className="flex-row items-center justify-between gap-3">
        <ThemedText>Non-member interest</ThemedText>
        <ThemedText className="font-mono-medium">
          {formatAmount(kosh.nonMemberInterestRate)}%
        </ThemedText>
      </View>
    </View>
  );
};
