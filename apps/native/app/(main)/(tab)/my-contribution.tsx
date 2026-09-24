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
import { RefreshControl, ScrollView, View } from "react-native";

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
      stickyHeaderIndices={[3]}
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
      {/* Index 0: Header Title */}
      <ThemedText className="text-2xl font-notosans-semibold">
        My Contributions
      </ThemedText>

      {/* Index 1: Horizontal Kosh Selector (Self-contained Infinite Query & LegendList) */}
      <HorizontalKoshSelector />

      {/* Index 2: Stats Summary */}
      <MyContributionStats stats={data?.stats} isPending={isPending} />

      {/* Index 3: Sticky Tab Bar */}
      <View className="bg-background pt-2 pb-1 z-10">
        <ContributionHistoryTabs
          isPending={isPending}
          statusFilter={statusFilter}
          items={data?.items ?? []}
          onStatusFilterChange={setStatusFilter}
        />
      </View>
    </ScrollView>
  );
};

export default MyContributionsScreen;
