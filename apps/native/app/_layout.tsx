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
import { ONBOARDING_COMPLETED } from "@kosh-app/constants";

export const unstable_settings = {
  initialRouteName: "(main)",
};

function StackLayout() {
  const { isDark } = useAppTheme();
  const { data: session } = authClient.useSession();
  const isOnboardingCompleted =
    storage.getBoolean(ONBOARDING_COMPLETED) ?? false;
  const isAuthenticated = session?.user != null;
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
        <Stack.Protected guard={!isOnboardingCompleted}>
          <Stack.Screen
            name="onboarding"
            options={{
              headerShown: false,
            }}
          />
        </Stack.Protected>

        <Stack.Protected guard={isOnboardingCompleted && !isAuthenticated}>
          <Stack.Screen
            name="(auth)"
            options={{
              headerShown: false,
            }}
          />
        </Stack.Protected>

        <Stack.Protected guard={isOnboardingCompleted && isAuthenticated}>
          <Stack.Screen
            name="(main)"
            options={{
              headerShown: false,
            }}
          />
        </Stack.Protected>
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
