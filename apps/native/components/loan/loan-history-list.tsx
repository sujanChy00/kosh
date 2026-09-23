import type { LoanStatusFilter, MyLoanItem } from "@kosh-app/api/routers/loan";
import { ActivityIndicator, View } from "react-native";
import { FadeInUp } from "react-native-reanimated";
import { AnimatedView } from "../animated-view";
import { StyledSymbolView } from "../styled-symbol-view";
import { ThemedText } from "../themed-text";
import { Card } from "../ui/card";
import { LoanCard } from "./loan-card";

interface Props {
  loanItems: MyLoanItem[];
  statusFilter: LoanStatusFilter;
  isPending: boolean;
}

export const LoanHistoryList = ({
  loanItems,
  statusFilter,
  isPending,
}: Props) => {
  if (isPending)
    return (
      <View className="flex-row justify-center items-center pt-3">
        <ActivityIndicator />
      </View>
    );

  if (!loanItems || loanItems.length === 0)
    return (
      <AnimatedView entering={FadeInUp.duration(300)}>
        <Card className="p-8 items-center justify-center gap-y-2">
          <StyledSymbolView
            tintColorClassName="accent-muted"
            size={32}
            name={{ android: "money_off" }}
          />
          <ThemedText className="text-muted-foreground text-sm font-mono-regular text-center">
            {statusFilter === "all"
              ? "You have no loans in any of your Koshes."
              : `No ${statusFilter.replaceAll("_", " ").toLowerCase()} loans found.`}
          </ThemedText>
        </Card>
      </AnimatedView>
    );

  return (
    <View className="gap-y-3">
      {loanItems.map((item) => (
        <LoanCard key={item.id} item={item} />
      ))}
    </View>
  );
};
