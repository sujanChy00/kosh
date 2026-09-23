import { HorizontalKoshSelector } from "@/components/kosh/horizontal-kosh-selector";
import { ErrorComponent } from "@/components/layout/error-component";
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

  const { data, isPending, isError, error, refetch, isRefetching } = useQuery({
    ...trpc.contribution.myContributions.queryOptions(
      selectedKosh ? { koshId: selectedKosh } : undefined,
    ),
  });

  if (isError) {
    return (
      <ErrorComponent
        refetch={refetch}
        message={error?.message ?? "Failed to load contributions."}
      />
    );
  }

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
        My Contributions
      </ThemedText>
      <HorizontalKoshSelector
        koshList={data?.koshes ?? []}
        isPending={isPending}
      />
      <MyContributionStats stats={data?.stats} isPending={isPending} />
      <ContributionHistoryTabs
        isPending={isPending}
        statusFilter={statusFilter}
        items={data?.items ?? []}
        onStatusFilterChange={setStatusFilter}
      />
    </ScrollView>
  );
};

export default MyContributionsScreen;
