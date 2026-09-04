import "@/global.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { AppThemeProvider, useAppTheme } from "@/contexts/app-theme-context";
import { authClient } from "@/lib/auth-client";
import { storage } from "@/utils/storage";
import { queryClient } from "@/utils/trpc";
import {} from "@kosh-app/constants";

export const unstable_settings = {
  initialRouteName: "(main)",
};

function StackLayout() {
  const { isDark } = useAppTheme();
  const { data: session } = authClient.useSession();
  const ONBOARDING_COMPLETED = storage.getBoolean(ONBOARDING_COMPLETED);
  return (
    <>
      <StatusBar
        style={isDark ? "light" : "dark"}
        animated
        key={`root-status-bar-${isDark ? "light" : "dark"}`}
      />
      <Stack
        screenOptions={{
          headerBackButtonDisplayMode: "minimal",
        }}
      >
        <Stack.Screen
          name="onboarding"
          options={{
            headerShown: false,
            headerBackButtonDisplayMode: "minimal",
          }}
        />
        <Stack.Screen
          name="(auth)"
          options={{
            headerShown: false,
            headerBackButtonDisplayMode: "minimal",
          }}
        />
        <Stack.Screen
          name="(main)"
          options={{
            headerShown: false,
            headerBackButtonDisplayMode: "minimal",
          }}
        />
      </Stack>
    </>
  );
}

export default function Layout() {
  // const healthCheck = useQuery(trpc.healthCheck.queryOptions());
  // const privateData = useQuery(trpc.privateData.queryOptions());
  // const isConnected = healthCheck?.data === "OK";
  // const isLoading = healthCheck?.isLoading;
  // const { data: session } = authClient.useSession();
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <AppThemeProvider>
            <StackLayout />
          </AppThemeProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
