import type { LoanStatusFilter, MyLoanItem } from "@kosh-app/api/routers/loan";
import { Tabs } from "../ui/tabs";
import { LoanHistoryList } from "./loan-history-list";

interface Props {
  tabValue: LoanStatusFilter;
  setTabValue: (value: LoanStatusFilter) => void;
  loanItems: MyLoanItem[];
  isPending: boolean;
}

export const LoanHistoryTabs = ({
  tabValue,
  setTabValue,
  loanItems,
  isPending,
}: Props) => {
  const filteredItems = loanItems.filter((item) => item.status === tabValue);
  return (
    <Tabs
      value={tabValue}
      onValueChange={(value) => setTabValue(value as LoanStatusFilter)}
    >
      <Tabs.List>
        <Tabs.Indicator />
        <Tabs.Trigger className="flex-1 px-0" value="all">
          <Tabs.Label className="text-xs font-mono-semibold">All</Tabs.Label>
        </Tabs.Trigger>
        <Tabs.Trigger className="flex-1 px-0" value="active">
          <Tabs.Label className="text-xs font-mono-semibold">Active</Tabs.Label>
        </Tabs.Trigger>
        <Tabs.Trigger className="flex-1 px-0" value="paid_off">
          <Tabs.Label className="text-xs font-mono-semibold">
            Paid Off
          </Tabs.Label>
        </Tabs.Trigger>
        <Tabs.Trigger className="flex-1 px-0" value="defaulted">
          <Tabs.Label className="text-xs font-mono-semibold">
            Defaulted
          </Tabs.Label>
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="all">
        <LoanHistoryList
          loanItems={loanItems}
          statusFilter="all"
          isPending={isPending}
        />
      </Tabs.Content>
      <Tabs.Content value="active">
        <LoanHistoryList
          loanItems={filteredItems}
          statusFilter="active"
          isPending={isPending}
        />
      </Tabs.Content>
      <Tabs.Content value="paid_off">
        <LoanHistoryList
          loanItems={filteredItems}
          statusFilter="paid_off"
          isPending={isPending}
        />
      </Tabs.Content>
      <Tabs.Content value="defaulted">
        <LoanHistoryList
          loanItems={filteredItems}
          statusFilter="defaulted"
          isPending={isPending}
        />
      </Tabs.Content>
    </Tabs>
  );
};
