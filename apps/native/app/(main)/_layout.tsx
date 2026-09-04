import { Stack } from "expo-router";

function MainLayout() {
  // const renderThemeToggle = useCallback(() => <ThemeToggle />, []);

  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen
        name="(tab)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(app)"
        options={{
          headerShown: false,
          headerBackButtonDisplayMode: "minimal",
        }}
      />
    </Stack>
  );
}

export default MainLayout;
