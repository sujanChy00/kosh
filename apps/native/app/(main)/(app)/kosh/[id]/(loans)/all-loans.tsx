import { EmptyComponent } from "@/components/layout/empty-component";
import { ErrorComponent } from "@/components/layout/error-component";
import { ListSeparatorComponent } from "@/components/layout/list-separator-component";
import { PendingComponent } from "@/components/layout/pending-component";
import { KoshLoanCard } from "@/components/loan/kosh-loan-card";
import { KoshPendingRequestCard } from "@/components/loan/kosh-pending-request-card";
import { ThemedText } from "@/components/themed-text";
import { trpc } from "@/utils/trpc";
import type {
  KoshLoanItem,
  KoshPendingLoanRequestItem,
} from "@kosh-app/api/routers/loan";
import { SectionList } from "@legendapp/list/section-list";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useMemo } from "react";
import { View } from "react-native";

type LoanItem = KoshLoanItem | KoshPendingLoanRequestItem;

type LoanSection = {
  title: string;
  data: LoanItem[];
};

const AllLoanScreen = () => {
  const { id: koshId } = useLocalSearchParams<{ id: string }>();
  const { data, isPending, isError, error, refetch, isRefetching } = useQuery({
    ...trpc.loan.byKosh.queryOptions({
      koshId,
      status: "all",
    }),
  });

  const sections = useMemo<LoanSection[]>(() => {
    if (!data) return [];
    return [
      { title: "Pending Requests", data: data.pendingRequests },
      { title: "Active Loans", data: data.activeLoans },
      { title: "Cleared Loans", data: data.clearedLoans },
    ].filter((section) => section.data.length > 0);
  }, [data]);

  const renderItem = useCallback(
    ({ item }: { item: LoanItem }) =>
      item.type === "request" ? (
        <KoshPendingRequestCard item={item} />
      ) : (
        <KoshLoanCard item={item} />
      ),
    [],
  );
  const renderSectionHeader = useCallback(
    ({ section }: { section: LoanSection }) => (
      <View className="flex-row items-center justify-between bg-background py-2">
        <ThemedText className="font-notosans-semibold text-base">
          {section.title} ({section.data.length})
        </ThemedText>
      </View>
    ),
    [],
  );
  const keyExtractor = useCallback(
    ({ id, type }: LoanItem) => `${type}-${id}`,
    [],
  );
  const ListSeparator = useCallback(() => <ListSeparatorComponent />, []);

  if (isPending) return <PendingComponent />;

  if (isError || !data) {
    return (
      <ErrorComponent
        refetch={refetch}
        message={error?.message ?? "Failed to load kosh loans."}
      />
    );
  }

  if (sections.length === 0) {
    return (
      <EmptyComponent
        message="No loans or requests found"
        description="Loans and pending requests for this kosh will appear here."
      />
    );
  }

  return (
    <SectionList
      stickySectionHeadersEnabled
      recycleItems
      contentContainerClassName="px-2 pb-20"
      showsVerticalScrollIndicator={false}
      sections={sections}
      renderSectionHeader={renderSectionHeader}
      keyExtractor={keyExtractor}
      refreshing={isRefetching}
      onRefresh={refetch}
      ItemSeparatorComponent={ListSeparator}
      drawDistance={500}
      onEndReachedThreshold={0.5}
      renderItem={renderItem}
      experimental_adaptiveRender={{
        enterVelocity: 6,
        exitVelocity: 3,
        exitDelay: 250,
      }}
    />
  );
};

export default AllLoanScreen;
