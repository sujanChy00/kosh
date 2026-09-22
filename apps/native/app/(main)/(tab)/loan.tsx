import { HorizontalKoshSelector } from "@/components/kosh/horizontal-kosh-selector";
import { ErrorComponent } from "@/components/layout/error-component";
import { PendingComponent } from "@/components/layout/pending-component";
import { LoanHistoryTabs } from "@/components/loan/loan-history-tabs";
import { LoanStats } from "@/components/loan/loan-stats";
import { ThemedText } from "@/components/themed-text";
import { trpc } from "@/utils/trpc";
import type { LoanStatusFilter } from "@kosh-app/api/routers/loan";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { RefreshControl, ScrollView } from "react-native";

const LoanScreen = () => {
  const { selectedKosh } = useLocalSearchParams<{ selectedKosh?: string }>();
  const [statusFilter, setStatusFilter] = useState<LoanStatusFilter>("all");

  const { data, isPending, isError, error, refetch, isRefetching } = useQuery({
    ...trpc.loan.myLoans.queryOptions(
      selectedKosh
        ? { koshId: selectedKosh, status: statusFilter }
        : { status: statusFilter },
    ),
  });

  if (isPending) return <PendingComponent />;

  if (isError || !data) {
    return (
      <ErrorComponent
        refetch={refetch}
        message={error?.message ?? "Failed to load loans."}
      />
    );
  }

  const { koshes, stats, items } = data;

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            refetch();
          }}
        />
      }
      showsVerticalScrollIndicator={false}
      contentContainerClassName="px-4 gap-y-5 pt-safe-offset-16 pb-safe-offset-24"
    >
      <ThemedText className="text-2xl font-notosans-semibold">
        My Loans
      </ThemedText>
      <HorizontalKoshSelector koshList={koshes} />
      <LoanStats stats={stats} />
      <LoanHistoryTabs
        tabValue={statusFilter}
        setTabValue={setStatusFilter}
        loanItems={items}
      />
    </ScrollView>
  );
};

export default LoanScreen;
