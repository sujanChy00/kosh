import { useQuery } from "@tanstack/react-query";
import { ScrollView, View } from "react-native";

import { StyledSymbolView } from "@/components/styled-symbol-view";
import { ThemedText } from "@/components/themed-text";
import { Avatar } from "@/components/ui/avatar";
import { SecondaryButton } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { formatLongDate } from "@kosh-app/utils/date";
import { Link } from "expo-router";
import { useState } from "react";

export default function Home() {
  const healthCheck = useQuery(trpc.healthCheck.queryOptions());
  const privateData = useQuery(trpc.privateData.queryOptions());
  const isConnected = healthCheck?.data === "OK";
  const isLoading = healthCheck?.isLoading;
  const [open, setOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const todayDate = formatLongDate(new Date());

  return (
    <ScrollView contentContainerClassName="px-4 pt-safe-offset-14">
      <View className="flex-row gap-3 justify-between items-center">
        <View>
          <ThemedText className="text-muted text-xs font-mono-medium">
            {todayDate}
          </ThemedText>
          <ThemedText className="font-notosans-semibold text-xl capitalize">
            Namaste, {user?.name}
          </ThemedText>
        </View>
        <View className="flex-row items-center gap-2">
          <Link href={"/notification"} asChild>
            <SecondaryButton className="p-0 size-10 relative">
              <View className="size-5 bg-danger items-center justify-center rounded-full absolute -top-1 right-1">
                <ThemedText className="text-danger-foreground text-xs font-mono">
                  1
                </ThemedText>
              </View>
              <StyledSymbolView
                tintColorClassName="accent-foreground"
                size={20}
                name={{
                  android: "notifications",
                  ios: "bell",
                }}
              />
            </SecondaryButton>
          </Link>
          <Link href={"/profile"}>
            <Avatar>
              <Avatar.Image alt={user?.name} source={user?.image} />
              <Avatar.Fallback
                source={user?.image}
                fallback={user?.name ?? ""}
              />
            </Avatar>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
