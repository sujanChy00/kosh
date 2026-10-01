import { KoshMemberContributionDetails } from "@/components/kosh/membership/kosh-member-contribution-details";
import KoshMemberOptions from "@/components/kosh/membership/kosh-member-options";
import { ErrorComponent } from "@/components/layout/error-component";
import { PendingComponent } from "@/components/layout/pending-component";
import { StyledSymbolView } from "@/components/styled-symbol-view";
import { ThemedText } from "@/components/themed-text";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Separator } from "@/components/ui/separator";
import { useHaptics } from "@/hooks/use-haptics";
import { trpc } from "@/utils/trpc";

import { formatAmount } from "@kosh-app/utils";
import { formatShortDate } from "@kosh-app/utils/date";
import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { RefreshControl, ScrollView, View } from "react-native";

const KoshMembershipScreen = () => {
  const { id: koshId, userId } = useLocalSearchParams<{
    id: string;
    userId: string;
  }>();
  const haptics = useHaptics();

  const { data, isPending, isError, error, refetch, isRefetching } = useQuery({
    ...trpc.membership.getMemberDetail.queryOptions({
      koshId: koshId!,
      userId: userId!,
    }),
    enabled: !!koshId && !!userId,
  });

  if (isPending)
    return (
      <>
        <Stack.Title>Loading...</Stack.Title>

        <PendingComponent />
      </>
    );

  if (isError || !data) {
    return (
      <>
        <Stack.Title>!Oops </Stack.Title>
        <ErrorComponent
          refetch={refetch}
          message={error?.message ?? "Failed to load member details."}
        />
      </>
    );
  }

  const {
    member,
    stats,
    activeLoan,
    contributions,
    viewerRole,
    isSelf,
    pendingTreasurerInvite,
  } = data;

  return (
    <View className="flex-1">
      <Stack.Title>{member.name ?? "Member details"}</Stack.Title>
      <KoshMemberOptions memberDetails={data} refetch={refetch} />
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
        contentContainerClassName="p-4 gap-y-6 pb-safe-offset-20"
      >
        {/* Profile Card */}
        <View>
          <Card className="items-center text-center p-5 gap-y-3">
            <Avatar className="size-20">
              <Avatar.Image source={member.image} alt={member.name ?? ""} />
              <Avatar.Fallback
                source={member.image}
                fallback={member.name ?? ""}
              />
            </Avatar>

            <View className="items-center gap-y-1">
              <ThemedText className="text-xl font-notosans-semibold capitalize text-center">
                {member.name ?? "Unnamed Member"}
              </ThemedText>
              {member.email && (
                <ThemedText className="text-muted-foreground text-xs font-mono-regular text-center">
                  {member.email}
                </ThemedText>
              )}
            </View>

            <View className="flex-row items-center gap-2 mt-1">
              {member.role === "adhyaksh" ? (
                <Chip variant="soft" color="warning" size="md">
                  <StyledSymbolView
                    tintColorClassName="accent-warning"
                    size={16}
                    name={{ android: "crown" }}
                  />
                  <Chip.Label className="capitalize font-mono-semibold">
                    Adhyaksh
                  </Chip.Label>
                </Chip>
              ) : member.role === "koshadhyaksh" ? (
                <Chip variant="soft" color="primary" size="md">
                  <StyledSymbolView
                    tintColorClassName="accent-primary"
                    size={16}
                    name={{ android: "account_balance" }}
                  />
                  <Chip.Label className="capitalize font-mono-semibold">
                    Koshadhyaksh
                  </Chip.Label>
                </Chip>
              ) : (
                <Chip variant="soft" color="default" size="md">
                  <StyledSymbolView
                    tintColorClassName="accent-muted"
                    size={16}
                    name={{ android: "person" }}
                  />
                  <Chip.Label className="capitalize font-mono-semibold">
                    Sadasya
                  </Chip.Label>
                </Chip>
              )}

              {member.joinedAt && (
                <ThemedText className="text-muted text-xs font-mono-regular">
                  · Joined {formatShortDate(new Date(member.joinedAt))}
                </ThemedText>
              )}
            </View>
            {pendingTreasurerInvite && (
              <View className="flex-row items-center gap-2 bg-warning/15 p-3 rounded-2xl">
                <StyledSymbolView
                  tintColorClassName="accent-warning"
                  size={18}
                  name={{ android: "schedule" }}
                />
                <ThemedText className="text-xs text-warning font-medium flex-1">
                  Treasurer invitation is pending response.
                </ThemedText>
              </View>
            )}
          </Card>
        </View>

        {/* Stats Grid */}
        <View className="gap-y-2">
          <ThemedText className="font-mono-medium text-xs uppercase text-muted-foreground">
            Financial Summary
          </ThemedText>
          <View className="gap-3">
            <View className="flex-row items-center gap-3">
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
            </View>
            <View className="flex-row items-center gap-3">
              <View className="flex-1 bg-surface p-4 rounded-2xl gap-y-1">
                <View className="flex-row items-center gap-2">
                  <StyledSymbolView
                    tintColorClassName="accent-success"
                    size={16}
                    name={{ android: "check_circle" }}
                  />
                  <ThemedText className="text-xs text-muted-foreground uppercase font-mono-regular">
                    Periods
                  </ThemedText>
                </View>
                <ThemedText className="text-lg font-mono-semibold">
                  {stats.paidPeriodsCount}{" "}
                  <ThemedText className="text-xs text-muted-foreground font-mono-regular">
                    ({stats.pendingPeriodsCount} pending)
                  </ThemedText>
                </ThemedText>
              </View>

              <View className="flex-1 bg-surface p-4 rounded-2xl gap-y-1">
                <View className="flex-row items-center gap-2">
                  <StyledSymbolView
                    tintColorClassName={
                      Number(stats.arrearsAmount) > 0
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
                    Number(stats.arrearsAmount) > 0 ? "text-danger" : ""
                  }`}
                >
                  रु {formatAmount(stats.arrearsAmount)}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Active Loan Details */}
        {activeLoan && (
          <View className="gap-y-2">
            <ThemedText className="font-mono-medium text-xs uppercase text-muted-foreground">
              Loan Overview
            </ThemedText>
            <Card className="p-4 gap-y-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <StyledSymbolView
                    tintColorClassName="accent-primary"
                    size={20}
                    name={{ android: "request_quote" }}
                  />
                  <ThemedText className="font-notosans-semibold text-base">
                    Active Loan
                  </ThemedText>
                </View>
                <Chip
                  variant="soft"
                  color={
                    activeLoan.status === "paid_off"
                      ? "success"
                      : activeLoan.status === "defaulted"
                        ? "danger"
                        : "warning"
                  }
                  size="sm"
                >
                  <Chip.Label className="uppercase font-mono-semibold">
                    {activeLoan.status.replaceAll("_", " ")}
                  </Chip.Label>
                </Chip>
              </View>

              <Separator />

              <View className="flex-row justify-between items-center">
                <View>
                  <ThemedText className="text-xs">
                    Remaining Principal
                  </ThemedText>
                  <ThemedText className="text-xl font-mono-semibold text-primary">
                    रु {formatAmount(activeLoan.amountRemaining)}
                  </ThemedText>
                </View>
                <View className="items-end">
                  <ThemedText className="text-xs">Original Loan</ThemedText>
                  <ThemedText className="text-base font-mono-regular">
                    रु {formatAmount(activeLoan.principal)}
                  </ThemedText>
                </View>
              </View>

              <Separator />

              <View className="flex-row justify-between items-center">
                <View>
                  <ThemedText className="text-xs">Total Repaid</ThemedText>
                  <ThemedText className="font-mono-semibold text-success">
                    रु {formatAmount(activeLoan.totalRepaid)}
                  </ThemedText>
                </View>
                <View className="items-end">
                  <ThemedText className="text-xs">Interest Paid</ThemedText>
                  <ThemedText className="font-mono-medium">
                    रु {formatAmount(activeLoan.totalInterestPaid)}
                  </ThemedText>
                </View>
              </View>

              <View className="pt-1 gap-y-1">
                <ThemedText className="text-xs font-mono-medium">
                  Interest Rate: {activeLoan.interestRate}% / mo (
                  {Number(activeLoan.interestRate) * 12}% / yr)
                </ThemedText>
                <ThemedText className="text-xs font-mono-medium">
                  Issued: {formatShortDate(new Date(activeLoan.issueDate))}
                </ThemedText>
              </View>
            </Card>
          </View>
        )}

        {/* Contribution History */}
        <View className="flex-row items-center justify-between">
          <ThemedText className="font-mono-medium text-xs uppercase text-muted-foreground">
            Contribution History ({contributions.length})
          </ThemedText>
        </View>

        <KoshMemberContributionDetails contributions={contributions} />
      </ScrollView>
    </View>
  );
};

export default KoshMembershipScreen;
