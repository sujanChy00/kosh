import type {
  ContributionStatusFilter,
  MyContributionItem,
} from "@kosh-app/api/routers/contribution";
import { View } from "react-native";
import { ThemedText } from "../themed-text";
import { Tabs } from "../ui/tabs";
import { MyContributionHistoryList } from "./my-contribution-history-list";

interface Props {
  statusFilter: ContributionStatusFilter;
  onStatusFilterChange: (filter: ContributionStatusFilter) => void;
  items: MyContributionItem[];
}

export const ContributionHistoryTabs = ({
  statusFilter,
  onStatusFilterChange,
  items,
}: Props) => {
  const filteredItems = items.filter((item) => item.status === statusFilter);
  return (
    <Tabs
      value={statusFilter}
      onValueChange={(filter) =>
        onStatusFilterChange(filter as ContributionStatusFilter)
      }
    >
      <Tabs.List>
        <Tabs.Indicator />
        <Tabs.Trigger value="all" className="flex-1 px-0">
          <Tabs.Label className="text-xs font-mono-semibold">All</Tabs.Label>
        </Tabs.Trigger>
        <Tabs.Trigger value="paid" className="flex-1 px-0">
          <Tabs.Label className="text-xs font-mono-semibold">Paid</Tabs.Label>
        </Tabs.Trigger>
        <Tabs.Trigger value="pending" className="flex-1 px-0">
          <Tabs.Label className="text-xs font-mono-semibold">
            Pending
          </Tabs.Label>
        </Tabs.Trigger>
        <Tabs.Trigger value="late" className="flex-1 px-0">
          <Tabs.Label className="text-xs font-mono-semibold">Late</Tabs.Label>
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="all">
        <View className="gap-y-3">
          <ThemedText className="font-mono-medium text-xs uppercase text-muted-foreground">
            Contribution History ({items.length})
          </ThemedText>
          <MyContributionHistoryList filter={statusFilter} items={items} />
        </View>
      </Tabs.Content>
      <Tabs.Content value="paid">
        <View className="gap-y-3">
          <ThemedText className="font-mono-medium text-xs uppercase text-muted-foreground">
            Contribution History ({filteredItems.length})
          </ThemedText>
          <MyContributionHistoryList
            filter={statusFilter}
            items={filteredItems}
          />
        </View>
      </Tabs.Content>
      <Tabs.Content value="pending">
        <View className="gap-y-3">
          <ThemedText className="font-mono-medium text-xs uppercase text-muted-foreground">
            Contribution History ({filteredItems.length})
          </ThemedText>
          <MyContributionHistoryList
            filter={statusFilter}
            items={filteredItems}
          />
        </View>
      </Tabs.Content>
      <Tabs.Content value="late">
        <View className="gap-y-3">
          <ThemedText className="font-mono-medium text-xs uppercase text-muted-foreground">
            Contribution History ({filteredItems.length})
          </ThemedText>
          <MyContributionHistoryList
            filter={statusFilter}
            items={filteredItems}
          />
        </View>
      </Tabs.Content>
      <Tabs.Content value="late">
        <View className="gap-y-3">
          <ThemedText className="font-mono-medium text-xs uppercase text-muted-foreground">
            Contribution History ({filteredItems.length})
          </ThemedText>
          <MyContributionHistoryList
            filter={statusFilter}
            items={filteredItems}
          />
        </View>
      </Tabs.Content>
    </Tabs>
  );
};
