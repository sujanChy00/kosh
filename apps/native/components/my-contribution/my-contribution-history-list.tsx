import type {
  ContributionStatusFilter,
  MyContributionItem,
} from "@kosh-app/api/routers/contribution";
import { ActivityIndicator, View } from "react-native";
import { StyledSymbolView } from "../styled-symbol-view";
import { ThemedText } from "../themed-text";
import { Card } from "../ui/card";
import { MyContributionCard } from "./my-contribution-card";

interface Props {
  items: MyContributionItem[];
  filter: ContributionStatusFilter;
  isPending: boolean;
}

export const MyContributionHistoryList = ({
  items,
  filter,
  isPending,
}: Props) => {
  if (isPending)
    return (
      <View className="flex-row justify-center items-center pt-3">
        <ActivityIndicator />
      </View>
    );

  if (!items || items.length === 0)
    return (
      <Card className="p-8 items-center justify-center gap-y-2">
        <StyledSymbolView
          tintColorClassName="accent-muted"
          size={32}
          name={{ android: "inbox" }}
        />
        <ThemedText className="text-muted-foreground text-sm font-mono-regular text-center">
          {filter === "all"
            ? "No contribution records found."
            : `No ${filter.replaceAll("_", " ")} contribution records found.`}
        </ThemedText>
      </Card>
    );

  return (
    <View className="gap-y-3">
      {items.map((item) => (
        <MyContributionCard item={item} key={item.id} />
      ))}
    </View>
  );
};
