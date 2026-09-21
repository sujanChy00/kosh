import { KoshMemberContributionDetails } from "@/components/kosh/membership/kosh-member-contribution-details";
import { AnimatedView } from "@/components/animated-view";
import { ErrorComponent } from "@/components/layout/error-component";
import { PendingComponent } from "@/components/layout/pending-component";
import { StyledSymbolView } from "@/components/styled-symbol-view";
import { ThemedText } from "@/components/themed-text";
import { Avatar } from "@/components/ui/avatar";
import { DangerSoftButton, SecondaryButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Separator } from "@/components/ui/separator";
import { useHaptics } from "@/hooks/use-haptics";
import { errorToast, successToast } from "@/utils/toast";
import { trpc } from "@/utils/trpc";
import { formatAmount } from "@kosh-app/utils";
import { formatShortDate } from "@kosh-app/utils/date";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Alert, RefreshControl, ScrollView, View } from "react-native";
import { FadeInUp } from "react-native-reanimated";

function formatPeriodName(periodStr: string) {
  const [yearStr, monthStr] = periodStr.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month) return periodStr;
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const KoshMembershipScreen = () => {
  const { id: koshId, userId } = useLocalSearchParams<{
    id: string;
    userId: string;
  }>();
  const router = useRouter();
  const haptics = useHaptics();

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    ...trpc.membership.getMemberDetail.queryOptions({
      koshId: koshId!,
      userId: userId!,
    }),
    enabled: !!koshId && !!userId,
  });

  const inviteTreasurerMutation = useMutation({
    ...trpc.membership.inviteTreasurer.mutationOptions(),
    onSuccess: () => {
      haptics("success");
      successToast({ title: "Treasurer invitation sent!" });
      refetch();
    },
    onError: (err) => {
      haptics("error");
      errorToast({ title: err.message ?? "Failed to send invitation" });
    },
  });

  const demoteTreasurerMutation = useMutation({
    ...trpc.membership.demoteTreasurer.mutationOptions(),
    onSuccess: () => {
      haptics("success");
      successToast({ title: "Demoted to member" });
      refetch();
    },
    onError: (err) => {
      haptics("error");
      errorToast({ title: err.message ?? "Failed to demote member" });
    },
  });

  const removeMemberMutation = useMutation({
    ...trpc.membership.removeMember.mutationOptions(),
    onSuccess: () => {
      haptics("success");
      successToast({ title: "Member removed from kosh" });
      router.back();
    },
    onError: (err) => {
      haptics("error");
      errorToast({ title: err.message ?? "Failed to remove member" });
    },
  });

  const handleInviteTreasurer = () => {
    Alert.alert(
      "Invite Treasurer",
      `Are you sure you want to invite ${data?.member.name ?? "this member"} to become a Koshadhyaksh (Treasurer)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Invite",
          onPress: () => {
            if (!koshId || !userId) return;
            inviteTreasurerMutation.mutate({ koshId, userId });
          },
        },
      ],
    );
  };

  const handleDemoteTreasurer = () => {
    Alert.alert(
      "Demote Treasurer",
      `Are you sure you want to demote ${data?.member.name ?? "this member"} back to a Sadasya (Member)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Demote",
          style: "destructive",
          onPress: () => {
            if (!koshId || !userId) return;
            demoteTreasurerMutation.mutate({ koshId, userId });
          },
        },
      ],
    );
  };

  const handleRemoveMember = () => {
    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${data?.member.name ?? "this member"} from the kosh? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            if (!koshId || !userId) return;
            removeMemberMutation.mutate({ koshId, userId });
          },
        },
      ],
    );
  };

  if (isLoading) return <PendingComponent />;

  if (isError || !data) {
    return (
      <ErrorComponent
        refetch={refetch}
        message={error?.message ?? "Failed to load member details."}
      />
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

  const canInviteTreasurer =
    viewerRole === "adhyaksh" &&
    member.role === "sadasya" &&
    !pendingTreasurerInvite &&
    !isSelf;

  const canDemoteTreasurer =
    viewerRole === "adhyaksh" && member.role === "koshadhyaksh" && !isSelf;

  const canRemoveMember =
    (viewerRole === "adhyaksh" || viewerRole === "koshadhyaksh") &&
    member.role !== "adhyaksh" &&
    !isSelf;

  return (
    <View className="flex-1">
      <Stack.Title>{member.name ?? "Member details"}</Stack.Title>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerClassName="p-4 gap-y-6 pb-safe-offset-20"
      >
        {/* Profile Card */}
        <AnimatedView entering={FadeInUp.duration(300)}>
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
          </Card>
        </AnimatedView>

        {/* Stats Grid */}
        <AnimatedView
          entering={FadeInUp.duration(400).delay(100)}
          className="gap-y-2"
        >
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
        </AnimatedView>

        {/* Active Loan Details */}
        {activeLoan && (
          <AnimatedView
            entering={FadeInUp.duration(400).delay(200)}
            className="gap-y-2"
          >
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
                    {activeLoan.status}
                  </Chip.Label>
                </Chip>
              </View>

              <Separator />

              <View className="flex-row justify-between items-center">
                <View>
                  <ThemedText className="text-xs text-muted-foreground">
                    Remaining Principal
                  </ThemedText>
                  <ThemedText className="text-xl font-mono-semibold text-primary">
                    रु {formatAmount(activeLoan.amountRemaining)}
                  </ThemedText>
                </View>
                <View className="items-end">
                  <ThemedText className="text-xs text-muted-foreground">
                    Original Loan
                  </ThemedText>
                  <ThemedText className="text-base font-mono-regular">
                    रु {formatAmount(activeLoan.principal)}
                  </ThemedText>
                </View>
              </View>

              <View className="flex-row justify-between items-center text-xs pt-1">
                <ThemedText className="text-muted-foreground text-xs font-mono-regular">
                  Interest Rate: {activeLoan.interestRate}% / mo (
                  {Number(activeLoan.interestRate) * 12}% / yr)
                </ThemedText>
                <ThemedText className="text-muted-foreground text-xs font-mono-regular">
                  Issued: {formatShortDate(new Date(activeLoan.issueDate))}
                </ThemedText>
              </View>
            </Card>
          </AnimatedView>
        )}

        {/* Admin / Treasurer Actions */}
        {(canInviteTreasurer ||
          canDemoteTreasurer ||
          canRemoveMember ||
          pendingTreasurerInvite) && (
          <AnimatedView
            entering={FadeInUp.duration(400).delay(300)}
            className="gap-y-2"
          >
            <ThemedText className="font-mono-medium text-xs uppercase text-muted-foreground">
              Management Actions
            </ThemedText>
            <View className="bg-surface p-4 rounded-3xl gap-y-3">
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

              {canInviteTreasurer && (
                <SecondaryButton
                  onPress={handleInviteTreasurer}
                  disabled={inviteTreasurerMutation.isPending}
                >
                  <StyledSymbolView
                    tintColorClassName="accent-primary"
                    size={18}
                    name={{ android: "badge" }}
                  />
                  <SecondaryButton.Label>
                    {inviteTreasurerMutation.isPending
                      ? "Sending..."
                      : "Invite as Koshadhyaksh (Treasurer)"}
                  </SecondaryButton.Label>
                </SecondaryButton>
              )}

              {canDemoteTreasurer && (
                <SecondaryButton
                  onPress={handleDemoteTreasurer}
                  disabled={demoteTreasurerMutation.isPending}
                >
                  <StyledSymbolView
                    tintColorClassName="accent-warning"
                    size={18}
                    name={{ android: "arrow_downward" }}
                  />
                  <SecondaryButton.Label>
                    {demoteTreasurerMutation.isPending
                      ? "Demoting..."
                      : "Demote to Sadasya"}
                  </SecondaryButton.Label>
                </SecondaryButton>
              )}

              {canRemoveMember && (
                <DangerSoftButton
                  onPress={handleRemoveMember}
                  disabled={removeMemberMutation.isPending}
                >
                  <StyledSymbolView
                    tintColorClassName="accent-danger"
                    size={18}
                    name={{ android: "person_remove" }}
                  />
                  <DangerSoftButton.Label>
                    {removeMemberMutation.isPending
                      ? "Removing..."
                      : "Remove Member from Kosh"}
                  </DangerSoftButton.Label>
                </DangerSoftButton>
              )}
            </View>
          </AnimatedView>
        )}

        {/* Contribution History */}
        <AnimatedView
          entering={FadeInUp.duration(400).delay(400)}
          className="gap-y-2"
        >
          <View className="flex-row items-center justify-between">
            <ThemedText className="font-mono-medium text-xs uppercase text-muted-foreground">
              Contribution History ({contributions.length})
            </ThemedText>
          </View>

          <KoshMemberContributionDetails contributions={contributions} />
        </AnimatedView>
      </ScrollView>
    </View>
  );
};

export default KoshMembershipScreen;
