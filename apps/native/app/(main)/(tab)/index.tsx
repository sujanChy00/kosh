import { HomeHeader } from "@/components/home/home-header";
import { HomeKoshList } from "@/components/home/home-kosh-list";
import { RecentActivityList } from "@/components/home/recent-activities";
import { JoinNewKoshDialog } from "@/components/kosh/join-new-kosh-dialog";
import { StyledSymbolView } from "@/components/styled-symbol-view";
import { PrimaryButton, SecondaryButton } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { Link, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();
  const {
    data: activities,
    isPending: isRecentActivityPending,
    isRefetching: isRefetchingRecentActivity,
    refetch: refetchRecentActivity,
  } = useQuery({
    ...trpc.kosh.recentActivity.queryOptions({ limit: 5 }),
  });

  const {
    data: koshList,
    isPending: isKoshListPending,
    isRefetching: isRefetchingKoshList,
    refetch: refetchKoshList,
  } = useQuery({
    ...trpc.kosh.list.queryOptions({
      limit: 5,
    }),
  });

  const handleRefresh = useCallback(() => {
    Promise.all([refetchKoshList(), refetchRecentActivity()]).catch((err) => {
      console.error("Refresh failed:", err);
    });
  }, [refetchKoshList, refetchRecentActivity]);

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={isRefetchingKoshList || isRefetchingRecentActivity}
          onRefresh={() => {
            handleRefresh();
          }}
        />
      }
      contentContainerClassName="px-4 pt-safe-offset-16 gap-y-4 pb-safe-offset-10"
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      <JoinNewKoshDialog
        isVisible={isVisible}
        setIsVisible={setIsVisible}
        onConfirm={(token) => {
          router.push({
            pathname: "/kosh/join",
            params: { token },
          });
        }}
      />
      <HomeHeader />
      <View className="flex-row items-center gap-3">
        <Link href="/kosh/add" asChild>
          <PrimaryButton wrapperClassName="flex-1">
            <StyledSymbolView
              tintColorClassName="accent-primary-foreground"
              size={18}
              name={{ android: "add_circle", ios: "plus.circle" }}
            />
            <PrimaryButton.Label className="text-xs font-mono-semibold">
              New Kosh
            </PrimaryButton.Label>
          </PrimaryButton>
        </Link>

        <SecondaryButton
          wrapperClassName="flex-1"
          onPress={() => setIsVisible(true)}
        >
          <StyledSymbolView
            tintColorClassName="accent-primary"
            size={18}
            name={{ android: "group_add", ios: "person.badge.plus" }}
          />
          <SecondaryButton.Label className="text-xs font-mono-semibold">
            Join Kosh
          </SecondaryButton.Label>
        </SecondaryButton>
      </View>
      <View className="pt-3 gap-y-6">
        <HomeKoshList
          koshList={koshList?.items ?? []}
          isPending={isKoshListPending}
        />
        <RecentActivityList
          activities={activities ?? []}
          isPending={isRecentActivityPending}
        />
      </View>
    </ScrollView>
  );
}
