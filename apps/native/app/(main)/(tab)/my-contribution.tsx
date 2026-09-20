import { AnimatedView } from "@/components/animated-view";
import { ErrorComponent } from "@/components/layout/error-component";
import { PendingComponent } from "@/components/layout/pending-component";
import { StyledSymbolView } from "@/components/styled-symbol-view";
import { ThemedText } from "@/components/themed-text";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/utils/trpc";
import { formatAmount } from "@kosh-app/utils";
import { formatShortDate } from "@kosh-app/utils/date";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { FadeInUp } from "react-native-reanimated";

type StatusFilter = "all" | "paid" | "pending" | "late";

const MyContributionsScreen = () => {
  const [selectedKoshId, setSelectedKoshId] = useState<string | undefined>(
    undefined,
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    ...trpc.contribution.myContributions.queryOptions(
      selectedKoshId ? { koshId: selectedKoshId } : undefined,
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
              My Contributions
            </ThemedText>
            <ThemedText className="text-xs text-muted-foreground">
              Track your monthly savings deposits, payment statuses, and dues
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
        <AnimatedView entering={FadeInUp.duration(400)} className={"gap-3"}>
          <View className="flex-row flex-wrap gap-3">
            <View className="flex-1 bg-surface p-4 rounded-2xl gap-y-1">
              <View className="flex-row items-center gap-2">
                <StyledSymbolView
                  tintColorClassName="accent-primary"
                  size={16}
                  name={{ android: "payments" }}
                />
                <ThemedText className="text-xs text-muted-foreground uppercase font-mono-regular">
                  Total Paid
                </ThemedText>
              </View>
              <ThemedText className="text-lg font-mono-semibold">
                रु {formatAmount(stats.totalPaid)}
              </ThemedText>
            </View>

            <View className="flex-1 bg-surface p-4 rounded-2xl gap-y-1">
              <View className="flex-row items-center gap-2">
                <StyledSymbolView
                  tintColorClassName={
                    Number(stats.unpaidDues) > 0
                      ? "accent-danger"
                      : "accent-muted"
                  }
                  size={16}
                  name={{ android: "account_balance_wallet" }}
                />
                <ThemedText className="text-xs text-muted-foreground uppercase font-mono-regular">
                  Unpaid Dues
                </ThemedText>
              </View>
              <ThemedText
                className={`text-lg font-mono-semibold ${
                  Number(stats.unpaidDues) > 0 ? "text-danger" : ""
                }`}
              >
                रु {formatAmount(stats.unpaidDues)}
              </ThemedText>
            </View>
          </View>
          <View className="flex-row flex-wrap gap-3">
            <View className="flex-1 bg-surface p-4 rounded-2xl gap-y-1">
              <View className="flex-row items-center gap-2">
                <StyledSymbolView
                  tintColorClassName="accent-warning"
                  size={16}
                  name={{ android: "warning" }}
                />
                <ThemedText className="text-xs text-muted-foreground uppercase font-mono-regular">
                  Penalties
                </ThemedText>
              </View>
              <ThemedText className="text-lg font-mono-semibold">
                रु {formatAmount(stats.totalPenaltiesPaid)}
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
                  Paid Periods
                </ThemedText>
              </View>
              <ThemedText className="text-lg font-mono-semibold">
                {stats.paidPeriodsCount}{" "}
                <ThemedText className="text-xs text-muted-foreground font-mono-regular">
                  ({stats.pendingPeriodsCount} pending)
                </ThemedText>
              </ThemedText>
            </View>
          </View>
        </AnimatedView>

        {/* Status Tabs */}
        <AnimatedView entering={FadeInUp.duration(450)}>
          <View className="flex-row bg-surface p-1 rounded-2xl">
            {(["all", "paid", "pending", "late"] as StatusFilter[]).map(
              (filter) => (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setStatusFilter(filter)}
                  className={`flex-1 py-2 items-center rounded-xl ${
                    statusFilter === filter ? "bg-primary/15" : ""
                  }`}
                  activeOpacity={0.7}
                >
                  <ThemedText
                    className={`text-xs capitalize font-mono-semibold ${
                      statusFilter === filter
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    {filter}
                  </ThemedText>
                </TouchableOpacity>
              ),
            )}
          </View>
        </AnimatedView>

        {/* Contributions List */}
        <AnimatedView entering={FadeInUp.duration(500)} className="gap-y-3">
          <ThemedText className="font-mono-medium text-xs uppercase text-muted-foreground">
            Contribution History ({filteredItems.length})
          </ThemedText>

          {filteredItems.length === 0 ? (
            <Card className="p-8 items-center justify-center gap-y-2">
              <StyledSymbolView
                tintColorClassName="accent-muted"
                size={32}
                name={{ android: "inbox" }}
              />
              <ThemedText className="text-muted-foreground text-sm font-mono-regular text-center">
                No contribution records found for this filter.
              </ThemedText>
            </Card>
          ) : (
            <View className="gap-y-3">
              {filteredItems.map((item) => (
                <Card key={item.id} className="p-4 gap-y-2.5">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2 flex-1 shrink">
                      <Avatar className="size-8">
                        <Avatar.Image
                          source={item.koshIconUrl}
                          alt={item.koshName}
                        />
                        <Avatar.Fallback
                          source={item.koshIconUrl}
                          fallback={item.koshName}
                        />
                      </Avatar>
                      <View className="flex-1 shrink">
                        <ThemedText
                          numberOfLines={1}
                          className="font-notosans-semibold text-base"
                        >
                          {item.koshName}
                        </ThemedText>
                        <ThemedText className="text-xs text-muted-foreground font-mono-regular">
                          {item.periodLabel}
                        </ThemedText>
                      </View>
                    </View>

                    <Chip
                      variant="soft"
                      color={
                        item.status === "paid"
                          ? "success"
                          : item.status === "late"
                            ? "warning"
                            : item.status === "partial"
                              ? "warning"
                              : "default"
                      }
                      size="sm"
                    >
                      <Chip.Label className="uppercase font-mono-semibold">
                        {item.status}
                      </Chip.Label>
                    </Chip>
                  </View>

                  <Separator />

                  <View className="flex-row justify-between items-center text-xs">
                    <View>
                      <ThemedText className="text-xs text-muted-foreground">
                        Contribution Paid / Expected
                      </ThemedText>
                      <ThemedText className="font-mono-semibold text-sm">
                        रु {formatAmount(item.contributionAmount)} / रु{" "}
                        {formatAmount(item.expectedAmount)}
                      </ThemedText>
                    </View>

                    {Number(item.penaltyPaid) > 0 && (
                      <View className="items-end">
                        <ThemedText className="text-xs text-warning font-mono-regular">
                          Penalty Paid: रु {formatAmount(item.penaltyPaid)}
                        </ThemedText>
                      </View>
                    )}
                  </View>

                  {item.datePaid && (
                    <ThemedText className="text-muted text-xs font-mono-regular">
                      Paid on {formatShortDate(new Date(item.datePaid))}
                    </ThemedText>
                  )}
                </Card>
              ))}
            </View>
          )}
        </AnimatedView>
      </ScrollView>
    </View>
  );
};

export default MyContributionsScreen;
