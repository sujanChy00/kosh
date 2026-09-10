import { useQuery } from "@tanstack/react-query";
import { ScrollView } from "react-native";

import { HomeHeader } from "@/components/home/home-header";
import { trpc } from "@/utils/trpc";

export default function Home() {
  const healthCheck = useQuery(trpc.healthCheck.queryOptions());
  const privateData = useQuery(trpc.privateData.queryOptions());
  const isConnected = healthCheck?.data === "OK";
  const isLoading = healthCheck?.isLoading;

  return (
    <ScrollView contentContainerClassName="px-4 pt-safe-offset-14">
      <HomeHeader />
    </ScrollView>
  );
}
