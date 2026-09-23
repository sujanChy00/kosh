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
  const activeItems = loanItems.filter((item) => item.status === "active");
  const pendingItems = loanItems.filter(
    (item) =>
      item.status === "pending_adhyaksh" || item.status === "pending_koshadhyaksh",
  );
  const clearedItems = loanItems.filter(
    (item) => item.status === "paid_off" || item.status === "defaulted",
  );

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
          <Tabs.Label className="text-xs font-mono-semibold">
            Active ({activeItems.length})
          </Tabs.Label>
        </Tabs.Trigger>
        <Tabs.Trigger className="flex-1 px-0" value="pending">
          <Tabs.Label className="text-xs font-mono-semibold">
            Pending ({pendingItems.length})
          </Tabs.Label>
        </Tabs.Trigger>
        <Tabs.Trigger className="flex-1 px-0" value="cleared">
          <Tabs.Label className="text-xs font-mono-semibold">
            Cleared ({clearedItems.length})
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
          loanItems={activeItems}
          statusFilter="active"
          isPending={isPending}
        />
      </Tabs.Content>
      <Tabs.Content value="pending">
        <LoanHistoryList
          loanItems={pendingItems}
          statusFilter="pending"
          isPending={isPending}
        />
      </Tabs.Content>
      <Tabs.Content value="cleared">
        <LoanHistoryList
          loanItems={clearedItems}
          statusFilter="cleared"
          isPending={isPending}
        />
      </Tabs.Content>
    </Tabs>
  );
};
