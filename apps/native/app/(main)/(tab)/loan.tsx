import { AnimatedView } from "@/components/animated-view";
import { ErrorComponent } from "@/components/layout/error-component";
import { PendingComponent } from "@/components/layout/pending-component";
import { LoanCard } from "@/components/loan/loan-card";
import { StyledSymbolView } from "@/components/styled-symbol-view";
import { ThemedText } from "@/components/themed-text";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Tabs } from "@/components/ui/tabs";
import { trpc } from "@/utils/trpc";
import type { MyLoanItem } from "@kosh-app/api/routers/loan";
import { formatAmount } from "@kosh-app/utils";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { FadeInUp } from "react-native-reanimated";

type StatusFilter = "all" | "active" | "paid_off" | "defaulted";

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: "All",
  active: "Active",
  paid_off: "Paid Off",
  defaulted: "Defaulted",
};

function loanStatusColor(
  status: MyLoanItem["status"],
): "success" | "warning" | "danger" | "default" {
  if (status === "active") return "warning";
  if (status === "paid_off") return "success";
  if (status === "defaulted") return "danger";
  return "default";
}

const LoanScreen = () => {
  const [tabValue, setTabValue] = useState<string>("all");
  const [selectedKoshId, setSelectedKoshId] = useState<string | undefined>(
    undefined,
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data, isPending, isError, error, refetch, isRefetching } = useQuery({
    ...trpc.loan.myLoans.queryOptions(
      selectedKoshId
        ? { koshId: selectedKoshId, status: statusFilter }
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

  // const filteredItems =
  //   statusFilter === "all"
  //     ? items
  //     : items.filter((item) => item.status === statusFilter);

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 gap-y-5 pt-safe-offset-12 pb-safe-offset-24"
      >
        {/* Header */}
        <AnimatedView entering={FadeInUp.duration(300)}>
          <View className="gap-y-1">
            <ThemedText className="text-2xl font-notosans-semibold">
              My Loans
            </ThemedText>
            <ThemedText className="text-xs text-muted-foreground">
              Track your borrowed amounts, repayments, and outstanding balances
              across your Koshes.
            </ThemedText>
          </View>
        </AnimatedView>

        {/* Kosh Filter Selector */}
        {koshes.length > 1 && (
          <AnimatedView entering={FadeInUp.duration(350)}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-x-2 py-1"
            >
              <Chip
                onPress={() => setSelectedKoshId(undefined)}
                variant={selectedKoshId === undefined ? "primary" : "soft"}
                color={selectedKoshId === undefined ? "primary" : "default"}
                size="md"
              >
                <Chip.Label className="font-mono-semibold">
                  All Koshes ({koshes.length})
                </Chip.Label>
              </Chip>

              {koshes.map((kosh) => (
                <Chip
                  key={kosh.id}
                  onPress={() => setSelectedKoshId(kosh.id)}
                  variant={selectedKoshId === kosh.id ? "primary" : "soft"}
                  color={selectedKoshId === kosh.id ? "primary" : "default"}
                  size="md"
                >
                  <Chip.Label className="font-mono-semibold">
                    {kosh.name}
                  </Chip.Label>
                </Chip>
              ))}
            </ScrollView>
          </AnimatedView>
        )}

        {/* Stats Grid */}
        <AnimatedView entering={FadeInUp.duration(400)} className="gap-3">
          <View className="flex-row flex-wrap gap-3">
            <View className="flex-1 bg-surface p-4 rounded-2xl gap-y-1">
              <View className="flex-row items-center gap-2">
                <StyledSymbolView
                  tintColorClassName={
                    stats.activeLoanCount > 0
                      ? "accent-warning"
                      : "accent-muted"
                  }
                  size={16}
                  name={{ android: "payments" }}
                />
                <ThemedText className="text-xs text-muted-foreground uppercase font-mono-regular">
                  Active Loans
                </ThemedText>
              </View>
              <ThemedText
                className={`text-lg font-mono-semibold ${stats.activeLoanCount > 0 ? "text-warning" : ""}`}
              >
                {stats.activeLoanCount}
              </ThemedText>
            </View>

            <View className="flex-1 bg-surface p-4 rounded-2xl gap-y-1">
              <View className="flex-row items-center gap-2">
                <StyledSymbolView
                  tintColorClassName={
                    Number(stats.totalRemaining) > 0
                      ? "accent-danger"
                      : "accent-muted"
                  }
                  size={16}
                  name={{ android: "account_balance_wallet" }}
                />
                <ThemedText className="text-xs text-muted-foreground uppercase font-mono-regular">
                  Outstanding
                </ThemedText>
              </View>
              <ThemedText
                className={`text-lg font-mono-semibold ${Number(stats.totalRemaining) > 0 ? "text-danger" : ""}`}
              >
                रु {formatAmount(stats.totalRemaining)}
              </ThemedText>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-3">
            <View className="flex-1 bg-surface p-4 rounded-2xl gap-y-1">
              <View className="flex-row items-center gap-2">
                <StyledSymbolView
                  tintColorClassName="accent-primary"
                  size={16}
                  name={{ android: "currency_rupee" }}
                />
                <ThemedText className="text-xs text-muted-foreground uppercase font-mono-regular">
                  Total Borrowed
                </ThemedText>
              </View>
              <ThemedText className="text-lg font-mono-semibold">
                रु {formatAmount(stats.totalBorrowed)}
              </ThemedText>
            </View>

            <View className="flex-1 bg-surface p-4 rounded-2xl gap-y-1">
              <View className="flex-row items-center gap-2">
                <StyledSymbolView
                  tintColorClassName="accent-success"
                  size={16}
                  name={{ android: "check_circle" }}
                />
                <ThemedText className="text-xs text-muted-foreground uppercase font-mono-regular">
                  Total Repaid
                </ThemedText>
              </View>
              <ThemedText className="text-lg font-mono-semibold">
                रु {formatAmount(stats.totalRepaid)}
              </ThemedText>
            </View>
          </View>
        </AnimatedView>
        <Tabs value={tabValue} onValueChange={setTabValue}>
          <Tabs.List>
            <Tabs.Indicator />
            <Tabs.Trigger className="flex-1 px-0" value="all">
              <Tabs.Label className="text-xs font-mono-semibold">
                All
              </Tabs.Label>
            </Tabs.Trigger>
            <Tabs.Trigger className="flex-1 px-0" value="active">
              <Tabs.Label className="text-xs font-mono-semibold">
                Active
              </Tabs.Label>
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
          <Tabs.Content value="all"></Tabs.Content>
        </Tabs>

        {/* Status Filter Tabs */}
        <AnimatedView entering={FadeInUp.duration(450)}>
          <View className="flex-row bg-surface p-1 rounded-2xl">
            {(["all", "active", "paid_off", "defaulted"] as StatusFilter[]).map(
              (filter) => (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setStatusFilter(filter)}
                  className={`flex-1 py-2 items-center rounded-xl ${statusFilter === filter ? "bg-primary/15" : ""}`}
                  activeOpacity={0.7}
                >
                  <ThemedText
                    className={`text-xs font-mono-semibold ${statusFilter === filter ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {STATUS_LABELS[filter]}
                  </ThemedText>
                </TouchableOpacity>
              ),
            )}
          </View>
        </AnimatedView>

        {/*{/* Loans List */}
        <AnimatedView entering={FadeInUp.duration(500)} className="gap-y-3">
          <ThemedText className="font-mono-medium text-xs uppercase text-muted-foreground">
            Loan History ({filteredItems.length})
          </ThemedText>

          {filteredItems.length === 0 ? (
            <Card className="p-8 items-center justify-center gap-y-2">
              <StyledSymbolView
                tintColorClassName="accent-muted"
                size={32}
                name={{ android: "money_off" }}
              />
              <ThemedText className="text-muted-foreground text-sm font-mono-regular text-center">
                {statusFilter === "all"
                  ? "You have no loans in any of your Koshes."
                  : `No ${STATUS_LABELS[statusFilter].toLowerCase()} loans found.`}
              </ThemedText>
            </Card>
          ) : (
            <View className="gap-y-3">
              {filteredItems.map((item) => (
                <LoanCard key={item.id} item={item} />
              ))}
            </View>
          )}
        </AnimatedView>*/}
      </ScrollView>
    </View>
  );
};

export default LoanScreen;
