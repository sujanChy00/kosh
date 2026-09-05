import { Stack } from "expo-router";

const OnboardingLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen name="step1" />
      <Stack.Screen name="step2" />
      <Stack.Screen name="step3" />
    </Stack>
  );
};

export default OnboardingLayout;
