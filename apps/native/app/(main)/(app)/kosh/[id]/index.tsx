import { InviteButton } from "@/components/kosh/invite-button";
import { KoshAmountInfo } from "@/components/kosh/kosh-amount-info";
import { KoshContributionInfo } from "@/components/kosh/kosh-contribution-info";
import { KoshDetailsHeader } from "@/components/kosh/kosh-details-header";
import { KoshLoanTerms } from "@/components/kosh/kosh-loan-terms";
import { KoshMembersList } from "@/components/kosh/kosh-membership-list";
import { ErrorComponent } from "@/components/layout/error-component";
import { PendingComponent } from "@/components/layout/pending-component";
import { PrimaryButton } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocalSearchParams } from "expo-router";
import { ScrollView, View } from "react-native";

const KoshDetailScreen = () => {
  const params = useLocalSearchParams<{
    id: string;
  }>();

  const koshId = params.id;
  const {
    data: koshData,
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
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-y-6 pb-safe-offset-6"
    >
      <View className="gap-y-6 px-4 pb-4 bg-primary pt-safe-offset-14">
        <KoshDetailsHeader kosh={koshData} />
        <KoshAmountInfo kosh={koshData} />
      </View>
      <View className="gap-y-6 px-4">
        <KoshContributionInfo kosh={koshData} />
        <KoshMembersList kosh={koshData} />
        <KoshLoanTerms kosh={koshData} />
      </View>
      <View className="flex-row items-center w-full gap-3 px-4">
        <InviteButton koshId={koshData.id} />
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
            <PrimaryButton.Label>Record Contribution</PrimaryButton.Label>
          </PrimaryButton>
        </Link>
      </View>
    </ScrollView>
  );
};

export default KoshDetailScreen;
