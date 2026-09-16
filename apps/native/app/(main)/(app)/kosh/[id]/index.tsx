import { KoshDetailsAmountInfo } from "@/components/kosh/kosh-details-amount-info";
import { KoshDetailsContributionInfo } from "@/components/kosh/kosh-details-contribution-info";
import { KoshDetailsHeader } from "@/components/kosh/kosh-details-header";
import { KoshDetailsMembersList } from "@/components/kosh/kosh-details-membership-list";
import { KoshLoanTerms } from "@/components/kosh/kosh-loan-terms";
import { ErrorComponent } from "@/components/layout/error-component";
import { PendingComponent } from "@/components/layout/pending-component";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
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
        <KoshDetailsAmountInfo kosh={koshData} />
      </View>
      <View className="gap-y-6 px-4">
        <KoshDetailsContributionInfo kosh={koshData} />
        <KoshDetailsMembersList kosh={koshData} />
        <KoshLoanTerms kosh={koshData} />
      </View>
    </ScrollView>
  );
};

export default KoshDetailScreen;
