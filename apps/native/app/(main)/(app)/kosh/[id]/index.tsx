import { AnimatedView } from "@/components/animated-view";
import { KoshContributionInfo } from "@/components/kosh/kosh-contribution-info";
import { KoshDetailsHeader } from "@/components/kosh/kosh-details-header";
import { KoshLoanTerms } from "@/components/kosh/kosh-loan-terms";
import { KoshMembersList } from "@/components/kosh/kosh-membership-list";
import { ErrorComponent } from "@/components/layout/error-component";
import { PendingComponent } from "@/components/layout/pending-component";
import { StyledSymbolView } from "@/components/styled-symbol-view";
import { PrimaryButton } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocalSearchParams } from "expo-router";
import { ScrollView, View } from "react-native";
import { RefreshControl } from "react-native-gesture-handler";
import { SlideInDown } from "react-native-reanimated";

const KoshDetailScreen = () => {
  const params = useLocalSearchParams<{
    id: string;
  }>();

  const koshId = params.id;
  const {
    data: koshData,
    isRefetching,
    isLoading: koshLoading,
    isError: koshError,
    error,
    refetch,
  } = useQuery({
    ...trpc.kosh.getById.queryOptions({ koshId }),
    enabled: !!koshId,
  });

  if (koshLoading) return <PendingComponent />;

  if (koshError || !koshData)
    return (
      <ErrorComponent
        refetch={refetch}
        message={error?.message ?? "Something went wrong."}
      />
    );

  return (
    <View className="flex-1">
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} />}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-y-6 pb-safe-offset-36"
      >
        <KoshDetailsHeader kosh={koshData} />
        <View className="gap-y-6 px-4">
          <KoshLoanTerms kosh={koshData} />
          <KoshContributionInfo kosh={koshData} />
          <KoshMembersList kosh={koshData} />
        </View>
      </ScrollView>
      <AnimatedView
        className="absolute bottom-0 p-3 pb-safe-offset-6 w-full gap-y-2"
        entering={SlideInDown.duration(400)}
      >
        <Link
          asChild
          href={{
            pathname: "/kosh/[id]/invite",
            params: {
              id: koshData.id,
            },
          }}
        >
          <PrimaryButton wrapperClassName="flex-1">
            <StyledSymbolView
              size={22}
              tintColorClassName="accent-primary-foreground"
              name={{
                android: "radio_button_checked",
              }}
            />
            <PrimaryButton.Label>Record Contribution</PrimaryButton.Label>
          </PrimaryButton>
        </Link>
      </AnimatedView>
    </View>
  );
};

export default KoshDetailScreen;
