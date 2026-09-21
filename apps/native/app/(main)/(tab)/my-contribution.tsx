import { HorizontalKoshSelector } from "@/components/kosh/horizontal-kosh-selector";
import { ErrorComponent } from "@/components/layout/error-component";
import { PendingComponent } from "@/components/layout/pending-component";
import { ContributionHistoryTabs } from "@/components/my-contribution/contribution-history-tabs";
import { MyContributionStats } from "@/components/my-contribution/my-contribution-stats";
import { ThemedText } from "@/components/themed-text";
import { trpc } from "@/utils/trpc";
import type { ContributionStatusFilter } from "@kosh-app/api/routers/contribution";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { RefreshControl, ScrollView } from "react-native";

const MyContributionsScreen = () => {
  const { selectedKosh } = useLocalSearchParams<{ selectedKosh?: string }>();
  const [statusFilter, setStatusFilter] =
    useState<ContributionStatusFilter>("all");

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    ...trpc.contribution.myContributions.queryOptions(
      selectedKosh ? { koshId: selectedKosh } : undefined,
    ),
  });

  if (isLoading) return <PendingComponent />;

  if (isError || !data) {
    return (
      <ErrorComponent
        refetch={refetch}
        message={error?.message ?? "Failed to load contributions."}
      />
    );
  }

  const { koshes, stats, items } = data;

  const filteredItems = items.filter((item) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "paid")
      return item.status === "paid" || item.status === "late";
    if (statusFilter === "pending")
      return item.status === "pending" || item.status === "partial";
    if (statusFilter === "late") return item.status === "late";
    return true;
  });

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
      showsVerticalScrollIndicator={false}
      contentContainerClassName="px-4 gap-y-5 pt-safe-offset-16 pb-safe-offset-24"
    >
      <ThemedText className="text-2xl font-notosans-semibold">
        My Contributions
      </ThemedText>
      <HorizontalKoshSelector koshList={koshes} />
      <MyContributionStats stats={stats} />
      <ContributionHistoryTabs
        statusFilter={statusFilter}
        items={items ?? []}
        onStatusFilterChange={setStatusFilter}
      />
    </ScrollView>
  );
};

export default MyContributionsScreen;
