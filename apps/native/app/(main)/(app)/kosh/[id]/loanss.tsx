import { AnimatedView } from "@/components/animated-view";
import { ErrorComponent } from "@/components/layout/error-component";
import { PendingComponent } from "@/components/layout/pending-component";
import { KoshLoanCard } from "@/components/loan/kosh-loan-card";
import { KoshPendingRequestCard } from "@/components/loan/kosh-pending-request-card";
import { StyledSymbolView } from "@/components/styled-symbol-view";
import { ThemedText } from "@/components/themed-text";
import { Card } from "@/components/ui/card";
import { DateInput } from "@/components/ui/date-input";
import { SelectInput } from "@/components/ui/select-input";
import { Tabs } from "@/components/ui/tabs";
import { trpc } from "@/utils/trpc";
import type { KoshLoanTabFilter } from "@kosh-app/api/routers/loan";
import { formatAmount } from "@kosh-app/utils";
import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { FadeInUp } from "react-native-reanimated";

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

  const { data, isPending, isError, error, refetch, isRefetching } = useQuery({
    ...trpc.loan.byKosh.queryOptions({
      koshId: koshId!,
      status: tabValue,
      memberId: selectedMemberId,
      dateFrom: dateFromStr,
      dateTo: dateToStr,
    }),
    enabled: !!koshId,
  });

  const memberOptions = useMemo(
    () =>
      data?.members.map((m) => ({
        label: m.label,
        value: m.id,
      })) ?? [{ label: "All Members", value: "all" }],
    [data?.members],
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

  if (isPending) return <PendingComponent />;

  if (isError || !data) {
    return (
      <ErrorComponent
        refetch={refetch}
        message={error?.message ?? "Failed to load kosh loans."}
      />
    );
  }

  const { activeLoans, pendingRequests, clearedLoans, stats } = data;

  return (
    <>
      <Stack.Title>{data.kosh.name} Loans</Stack.Title>
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
        contentContainerClassName="px-4 gap-y-4 pt-safe-offset-4 pb-safe-offset-20"
      >
        {/* Screen Title */}
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

        {/* Expandable Filter Panel */}
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

              {/* Member Selector */}
              <SelectInput
                label="Member"
                options={memberOptions}
                value={selectedMemberId}
                onValueChange={setSelectedMemberId}
                placeholder="Select member"
              />

              {/* Date Range Inputs */}
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

        {/* Top 4 Options Tabs */}
        <Tabs
          value={tabValue}
          onValueChange={(val) => setTabValue(val as KoshLoanTabFilter)}
        >
          <Tabs.List>
            <Tabs.Indicator />
            <Tabs.Trigger className="flex-1 px-0" value="all">
              <Tabs.Label className="text-xs font-mono-semibold">
                All
              </Tabs.Label>
            </Tabs.Trigger>
            <Tabs.Trigger className="flex-1 px-0" value="active">
              <Tabs.Label className="text-xs font-mono-semibold">
                Active ({stats.activeCount})
              </Tabs.Label>
            </Tabs.Trigger>
            <Tabs.Trigger className="flex-1 px-0" value="pending">
              <Tabs.Label className="text-xs font-mono-semibold">
                Pending ({stats.pendingCount})
              </Tabs.Label>
            </Tabs.Trigger>
            <Tabs.Trigger className="flex-1 px-0" value="cleared">
              <Tabs.Label className="text-xs font-mono-semibold">
                Cleared ({stats.clearedCount})
              </Tabs.Label>
            </Tabs.Trigger>
          </Tabs.List>

          {/* Tab 1: All (Shows Loans in Sections) */}
          <Tabs.Content value="all">
            <View className="gap-y-6 pt-2">
              {activeLoans.length > 0 && (
                <View className="gap-y-3">
                  <View className="flex-row items-center justify-between">
                    <ThemedText className="font-notosans-semibold text-base">
                      Active Loans ({activeLoans.length})
                    </ThemedText>
                    <ThemedText className="font-mono-semibold text-xs text-muted-foreground">
                      Total: रु {formatAmount(stats.activeAmount)}
                    </ThemedText>
                  </View>
                  {activeLoans.map((item) => (
                    <KoshLoanCard key={item.id} item={item} />
                  ))}
                </View>
              )}

              {pendingRequests.length > 0 && (
                <View className="gap-y-3">
                  <View className="flex-row items-center justify-between">
                    <ThemedText className="font-notosans-semibold text-base">
                      Pending Requests ({pendingRequests.length})
                    </ThemedText>
                    <ThemedText className="font-mono-semibold text-xs text-warning">
                      Total: रु {formatAmount(stats.pendingAmount)}
                    </ThemedText>
                  </View>
                  {pendingRequests.map((item) => (
                    <KoshPendingRequestCard key={item.id} item={item} />
                  ))}
                </View>
              )}

              {clearedLoans.length > 0 && (
                <View className="gap-y-3">
                  <View className="flex-row items-center justify-between">
                    <ThemedText className="font-notosans-semibold text-base">
                      Cleared Loans ({clearedLoans.length})
                    </ThemedText>
                    <ThemedText className="font-mono-semibold text-xs text-muted-foreground">
                      Total: रु {formatAmount(stats.clearedAmount)}
                    </ThemedText>
                  </View>
                  {clearedLoans.map((item) => (
                    <KoshLoanCard key={item.id} item={item} />
                  ))}
                </View>
              )}

              {activeLoans.length === 0 &&
                pendingRequests.length === 0 &&
                clearedLoans.length === 0 && (
                  <Card className="p-8 items-center justify-center gap-y-2">
                    <StyledSymbolView
                      tintColorClassName="accent-muted"
                      size={32}
                      name={{ android: "money_off" }}
                    />
                    <ThemedText className="text-muted-foreground text-sm font-mono-regular text-center">
                      No loans or requests found for the selected filters.
                    </ThemedText>
                  </Card>
                )}
            </View>
          </Tabs.Content>

          {/* Tab 2: Active */}
          <Tabs.Content value="active">
            <View className="gap-y-3 pt-2">
              {activeLoans.length > 0 ? (
                activeLoans.map((item) => (
                  <KoshLoanCard key={item.id} item={item} />
                ))
              ) : (
                <Card className="p-8 items-center justify-center gap-y-2">
                  <StyledSymbolView
                    tintColorClassName="accent-muted"
                    size={32}
                    name={{ android: "money_off" }}
                  />
                  <ThemedText className="text-muted-foreground text-sm font-mono-regular text-center">
                    No active loans found.
                  </ThemedText>
                </Card>
              )}
            </View>
          </Tabs.Content>

          {/* Tab 3: Pending */}
          <Tabs.Content value="pending">
            <View className="gap-y-3 pt-2">
              {pendingRequests.length > 0 ? (
                pendingRequests.map((item) => (
                  <KoshPendingRequestCard key={item.id} item={item} />
                ))
              ) : (
                <Card className="p-8 items-center justify-center gap-y-2">
                  <StyledSymbolView
                    tintColorClassName="accent-muted"
                    size={32}
                    name={{ android: "schedule" }}
                  />
                  <ThemedText className="text-muted-foreground text-sm font-mono-regular text-center">
                    No pending loan requests found.
                  </ThemedText>
                </Card>
              )}
            </View>
          </Tabs.Content>

          {/* Tab 4: Cleared */}
          <Tabs.Content value="cleared">
            <View className="gap-y-3 pt-2">
              {clearedLoans.length > 0 ? (
                clearedLoans.map((item) => (
                  <KoshLoanCard key={item.id} item={item} />
                ))
              ) : (
                <Card className="p-8 items-center justify-center gap-y-2">
                  <StyledSymbolView
                    tintColorClassName="accent-muted"
                    size={32}
                    name={{ android: "check_circle" }}
                  />
                  <ThemedText className="text-muted-foreground text-sm font-mono-regular text-center">
                    No cleared loans found.
                  </ThemedText>
                </Card>
              )}
            </View>
          </Tabs.Content>
        </Tabs>
      </ScrollView>
    </>
  );
};

export default KoshLoanScreen;
