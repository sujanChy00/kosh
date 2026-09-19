import { ErrorComponent } from "@/components/layout/error-component";
import { PendingComponent } from "@/components/layout/pending-component";
import { KoshForm } from "@/form/kosh/kosh-form";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";

const EditKosh = () => {
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

  return <KoshForm data={koshData} />;
};

export default EditKosh;
