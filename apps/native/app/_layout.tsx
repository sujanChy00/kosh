import { StyledSymbolView } from "@/components/styled-symbol-view";
import { FullScreenSpinner } from "@/components/ui/full-screen-spinner";
import { NAV_THEME } from "@/constants/theme";
import { AppThemeProvider, useAppTheme } from "@/contexts/app-theme-context";
import "@/global.css";
import { useOnboarding } from "@/hooks/use-onboarding";
import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/trpc";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { ThemeProvider } from "expo-router/react-navigation";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { Toaster } from "sonner-native";

export const unstable_settings = {
  initialRouteName: "(main)",
};

function StackLayout() {
  const { isDark, currentTheme } = useAppTheme();
  const { data: session, isPending } = authClient.useSession();
  const { isOnboardingCompleted } = useOnboarding();
  const isAuthenticated = session?.user != null;

  console.log(session);

  if (isPending) return <FullScreenSpinner isVisible />;
  return (
    <>
      <ThemeProvider value={NAV_THEME[currentTheme || "light"]}>
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
              name="(onboarding)"
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
      </ThemeProvider>
      <Toaster
        enableStacking
        position="top-center"
        richColors
        theme={currentTheme}

        icons={{
          loading: (
            <ActivityIndicator
              size={"small"}
              colorClassName="accent-blue-400"
            />
          ),
          error: (
            <StyledSymbolView
              tintColorClassName="accent-danger"
              name={{
                android: "cancel",
                ios: "xmark.circle.fill",
              }}
            />
          ),

          info: (
            <StyledSymbolView
              tintColorClassName="accent-blue-400"
              name={{
                android: "info",
                ios: "info.circle.fill",
              }}
            />
          ),

          success: (
            <StyledSymbolView
              tintColorClassName="accent-success"
              name={{
                android: "check_circle",
                ios: "checkmark.circle.fill",
              }}
            />
          ),

          warning: (
            <StyledSymbolView
              tintColorClassName="accent-warning"
              name={{
                android: "warning",
                ios: "exclamationmark.triangle.fill",
              }}
            />
          ),
        }}
      />
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
