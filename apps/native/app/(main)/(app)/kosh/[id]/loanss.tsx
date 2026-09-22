import { AnimatedView } from "@/components/animated-view";
import { EmptyComponent } from "@/components/layout/empty-component";
import { ErrorComponent } from "@/components/layout/error-component";
import { PendingComponent } from "@/components/layout/pending-component";
import { StyledSymbolView } from "@/components/styled-symbol-view";
import { ThemedText } from "@/components/themed-text";
import { KoshLoanList } from "@/components/loan/kosh-loan-list";
import { Card } from "@/components/ui/card";
import { DateInput } from "@/components/ui/date-input";
import { SelectInput } from "@/components/ui/select-input";
import { Tabs } from "@/components/ui/tabs";
import { trpc } from "@/utils/trpc";
import type { KoshLoanTabFilter } from "@kosh-app/api/routers/loan";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { FadeInUp } from "react-native-reanimated";

const PAGE_SIZE = 10;

const KoshLoanScreen = () => {
  const { id: koshId } = useLocalSearchParams<{ id: string }>();
  const [tabValue, setTabValue] = useState<KoshLoanTabFilter>("all");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);

  const dateFromStr = useMemo(
    () => (dateFrom ? dateFrom.toISOString().split("T")[0] : undefined),
    [dateFrom],
  );
  const dateToStr = useMemo(
    () => (dateTo ? dateTo.toISOString().split("T")[0] : undefined),
    [dateTo],
  );

  const {
    data,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isRefetching,
    refetch,
    isLoading,
    error,
    isError,
  } = useInfiniteQuery(
    trpc.loan.allLoansByKosh.infiniteQueryOptions(
      {
        koshId,
        status: tabValue,
        memberId: selectedMemberId === "all" ? undefined : selectedMemberId,
        dateFrom: dateFromStr,
        dateTo: dateToStr,
        limit: PAGE_SIZE,
      },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  const memberOptions = useMemo(
    () => [
      { label: "All Members", value: "all" },
      ...(data?.pages[0]?.members ?? [])
        .filter((m) => m.id !== "all")
        .map((m) => ({ label: m.label, value: m.id })),
    ],
    [data],
  );

  const isFiltered =
    selectedMemberId !== "all" ||
    dateFrom !== undefined ||
    dateTo !== undefined;

  const handleResetFilters = () => {
    setSelectedMemberId("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <PendingComponent />;

  if (isError) {
    return (
      <ErrorComponent
        refetch={refetch}
        message={error?.message ?? "Failed to load kosh loans."}
      />
    );
  }

  const header = (
    <View className="px-4 gap-y-4 pt-2">
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() => setShowFilters((prev) => !prev)}
          className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl border ${
            isFiltered || showFilters
              ? "bg-primary/10 border-primary"
              : "bg-card border-border"
          }`}
        >
          <StyledSymbolView
            size={18}
            tintColorClassName={
              isFiltered || showFilters
                ? "accent-primary"
                : "accent-muted-foreground"
            }
            name={{ android: "filter_list" }}
          />
          <ThemedText
            className={`text-xs font-mono-semibold ${
              isFiltered || showFilters
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            Filters{isFiltered ? " (Active)" : ""}
          </ThemedText>
        </Pressable>
      </View>

      {showFilters && (
        <AnimatedView entering={FadeInUp.duration(200)}>
          <Card className="p-4 gap-y-3 bg-muted/20">
            <View className="flex-row items-center justify-between">
              <ThemedText className="text-xs font-notosans-semibold uppercase text-muted-foreground">
                Filter Loans
              </ThemedText>
              {isFiltered && (
                <Pressable onPress={handleResetFilters}>
                  <ThemedText className="text-xs font-mono-semibold text-primary">
                    Reset
                  </ThemedText>
                </Pressable>
              )}
            </View>

            <SelectInput
              label="Member"
              options={memberOptions}
              value={selectedMemberId}
              onValueChange={setSelectedMemberId}
              placeholder="Select member"
            />

            <View className="flex-row gap-2">
              <View className="flex-1">
                <DateInput
                  label="From Date"
                  placeholder="Select start"
                  value={dateFrom}
                  onChange={setDateFrom}
                />
              </View>
              <View className="flex-1">
                <DateInput
                  label="To Date"
                  placeholder="Select end"
                  value={dateTo}
                  onChange={setDateTo}
                />
              </View>
            </View>
          </Card>
        </AnimatedView>
      )}

      <Tabs
        value={tabValue}
        onValueChange={(val) => setTabValue(val as KoshLoanTabFilter)}
      >
        <Tabs.List>
          <Tabs.Indicator />
          <Tabs.Trigger className="flex-1 px-0" value="all">
            <Tabs.Label className="text-xs font-mono-semibold">All</Tabs.Label>
          </Tabs.Trigger>
          <Tabs.Trigger className="flex-1 px-0" value="active">
            <Tabs.Label className="text-xs font-mono-semibold">
              Active
            </Tabs.Label>
          </Tabs.Trigger>
          <Tabs.Trigger className="flex-1 px-0" value="pending">
            <Tabs.Label className="text-xs font-mono-semibold">
              Pending
            </Tabs.Label>
          </Tabs.Trigger>
          <Tabs.Trigger className="flex-1 px-0" value="cleared">
            <Tabs.Label className="text-xs font-mono-semibold">
              Cleared
            </Tabs.Label>
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs>
    </View>
  );

  return (
    <KoshLoanList
      items={items}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
      loadMore={loadMore}
      refreshing={isRefetching}
      onRefresh={refetch}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <EmptyComponent
          message={
            isFiltered
              ? "No loans match your filters"
              : "No loans or requests found for the selected filters."
          }
          description="Loans and pending requests for this kosh will appear here."
        />
      }
    />
  );
};

export default KoshLoanScreen;