import { StyledSymbolView } from "@/components/styled-symbol-view";
import { FullScreenSpinner } from "@/components/ui/full-screen-spinner";
import type { IToastSwipeAction } from "@/components/ui/Toast";
import { Toaster } from "@/components/ui/Toast";
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
import { Fragment, useEffect, useState } from "react";
import { Dimensions } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

const _width = Dimensions.get("window").width;
const SWIPE_ACTION: IToastSwipeAction = {
  label: "Delete",
  color: "#FF3B30",
  direction: "left" as const,
  icon: () => (
    <StyledSymbolView
      name="trash.fill"
      size={18}
      tintColorClassName={"accent-foreground"}
    />
  ),
  commitOffset: _width * 0.8,
  onCommit: () => {},
};

export const unstable_settings = {
  initialRouteName: "(main)",
};

function StackLayout() {
  const { isDark, currentTheme } = useAppTheme();
  const { data: session, isPending } = authClient.useSession();
  const { isOnboardingCompleted } = useOnboarding();
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const isAuthenticated = session?.user != null;

  useEffect(() => {
    if (!isPending) setHasCheckedSession(true);
  }, [isPending]);

  // Only block the app on the very first session resolution (cold start).
  // Background refetches (e.g. better-auth refetching on app focus after an
  // iOS autofill/strong-password overlay) must not unmount the tree, which
  // would reset an in-progress auth form.
  if (!hasCheckedSession && isPending && session == null) {
    return <FullScreenSpinner isVisible />;
  }
  return (
    <Fragment>
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
        swipeDirection="horizontal"
        theme={currentTheme}
        position={"top"}
        offset={30}
        swipeAction={SWIPE_ACTION}
      />
    </Fragment>
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
      <GestureHandlerRootView style={{ flex: 1 }} pointerEvents="box-none">
        <KeyboardProvider>
          <AppThemeProvider>
            <StackLayout />
          </AppThemeProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
