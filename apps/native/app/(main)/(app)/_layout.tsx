import { Stack } from "expo-router";

const AppLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen
        name="notification"
        options={{
          headerTitle: "Notifications",
        }}
      />
      <Stack.Screen
        name="about"
        options={{
          headerTitle: "About",
        }}
      />
    </Stack>
  );
};

export default AppLayout;
