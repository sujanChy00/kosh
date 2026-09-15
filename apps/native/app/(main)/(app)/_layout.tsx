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
        name="contribution"
        options={{
          headerTitle: "Contributions",
        }}
      />
      <Stack.Screen
        name="about"
        options={{
          headerTitle: "About",
        }}
      />
      <Stack.Screen
        name="setting/update-password"
        options={{
          headerTitle: "Update Password",
        }}
      />
      <Stack.Screen
        name="setting/update-profile"
        options={{
          headerTitle: "Update profile",
        }}
      />
      <Stack.Screen
        name="image/[image]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="kosh/add"
        options={{
          headerTitle: "Add a new kosh",
        }}
      />
      <Stack.Screen
        name="kosh/[id]"
        options={{
          headerTitle: "Kosh",
        }}
      />
      <Stack.Screen
        name="join"
        options={{
          headerTitle: "Join kosh",
        }}
      />
      <Stack.Screen
        name="join-requests"
        options={{
          headerTitle: "Join requests",
        }}
      />
    </Stack>
  );
};

export default AppLayout;
