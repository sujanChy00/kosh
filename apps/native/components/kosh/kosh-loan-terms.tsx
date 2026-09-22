import type { KoshDetail } from "@kosh-app/api/routers/kosh";
import { formatAmount } from "@kosh-app/utils";
import { View } from "react-native";
import { StyledSymbolView } from "../styled-symbol-view";
import { ThemedText } from "../themed-text";
import { Chip } from "../ui/chip";

export const KoshLoanTerms = ({ kosh }: { kosh: KoshDetail }) => {
  return (
    <View className="bg-primary/30 border-primary border rounded-3xl p-3 flex-row items-center justify-between gap-3">
      <View className="flex-1 gap-y-1.5">
        <Chip className="p-0 size-8">
          <StyledSymbolView
            size={16}
            tintColorClassName="accent-primary-foreground"
            name={{
              android: "currency_rupee",
            }}
          />
        </Chip>
        <ThemedText className="text-xs dark:text-muted-foreground text-gray-800">
          Loan cap
        </ThemedText>
        <ThemedText className="font-mono-medium">
          रु {formatAmount(kosh.loanCap)}
        </ThemedText>
      </View>
      <View className="w-px h-full bg-separator" />
      <View className="flex-1 gap-y-1.5">
        <Chip className="p-0 size-8">
          <StyledSymbolView
            size={16}
            tintColorClassName="accent-primary-foreground"
            name={{
              android: "percent",
            }}
          />
        </Chip>
        <ThemedText className="text-xs dark:text-muted-foreground text-gray-800">
          Member interest rate
        </ThemedText>
        <ThemedText className="font-mono-medium">
          {kosh.memberInterestRate}%
        </ThemedText>
      </View>
      <View className="w-px h-full bg-separator" />
      <View className="flex-1 gap-y-1.5">
        <Chip className="p-0 size-8">
          <StyledSymbolView
            size={16}
            tintColorClassName="accent-primary-foreground"
            name={{
              android: "percent",
            }}
          />
        </Chip>
        <ThemedText className="text-xs dark:text-muted-foreground text-gray-800">
          Non-member interest
        </ThemedText>
        <ThemedText className="font-mono-medium">
          {kosh.nonMemberInterestRate}%
        </ThemedText>
      </View>
    </View>
  );
};
