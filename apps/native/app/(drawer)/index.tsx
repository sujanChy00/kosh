import { useQuery } from "@tanstack/react-query";
import { SymbolView } from "expo-symbols";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { Container } from "@/components/container";
import { SignIn } from "@/components/sign-in";
import { SignUp } from "@/components/sign-up";
import { authClient } from "@/lib/auth-client";
import { queryClient, trpc } from "@/utils/trpc";

export default function Home() {
  const healthCheck = useQuery(trpc.healthCheck.queryOptions());
  const privateData = useQuery(trpc.privateData.queryOptions());
  const isConnected = healthCheck?.data === "OK";
  const isLoading = healthCheck?.isLoading;
  const { data: session } = authClient.useSession();

  return (
    <Container className="p-6">
      <View className="py-4 mb-6">
        <Text className="text-4xl font-bold text-foreground mb-2">
          BETTER T STACK
        </Text>
      </View>

      {session?.user ? (
        <View className="mb-6 p-4">
          <Text className="text-foreground text-base mb-2">
            Welcome, <Text className="font-medium">{session.user.name}</Text>
          </Text>
          <Text className="text-muted text-sm mb-4">{session.user.email}</Text>
          <Pressable
            className="bg-danger py-3 px-4 rounded-lg self-start active:opacity-70"
            onPress={() => {
              authClient.signOut();
              queryClient.invalidateQueries();
            }}
          >
            <Text className="text-foreground font-medium">Sign Out</Text>
          </Pressable>
        </View>
      ) : null}

      <View className="p-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text>System Status</Text>
          <View className="p-2">
            <View
              style={{
                height: 10,
                width: 10,
                borderRadius: 50,
                backgroundColor: isConnected ? "green" : "red",
              }}
            />
            <Text>{isConnected ? "LIVE" : "OFFLINE"}</Text>
          </View>
        </View>

        <View className="p-4">
          <View className="flex-row items-center">
            <View
              className={`w-3 h-3 rounded-full mr-3 ${isConnected ? "bg-success" : "bg-muted"}`}
            />
            <View className="flex-1">
              <Text className="text-foreground font-medium mb-1">
                TRPC Backend
              </Text>
              <Text>
                {isLoading
                  ? "Checking connection..."
                  : isConnected
                    ? "Connected to API"
                    : "API Disconnected"}
              </Text>
            </View>
            {isLoading && <ActivityIndicator />}
            {!isLoading && isConnected && (
              <SymbolView
                name={{
                  android: "check_circle",
                  ios: "checkmark.circle.fill",
                }}
                tintColor="green"
                size={24}
              />
            )}
            {!isLoading && !isConnected && (
              <SymbolView
                name={{
                  android: "close",
                  ios: "xmark.circle.fill",
                }}
                tintColor="red"
                size={24}
              />
            )}
          </View>
        </View>
      </View>

      <View className="mt-6 p-4">
        <Text className="mb-3">Private Data</Text>
        {privateData && <Text>{privateData.data?.message}</Text>}
      </View>

      {!session?.user && (
        <>
          <SignIn />
          <SignUp />
        </>
      )}
    </Container>
  );
}
