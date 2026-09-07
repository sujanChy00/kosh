import { OnboardingStepButton } from "@/components/layout/onboarding-step-button";
import { StyledSafeAreaView } from "@/components/layout/styled-safearea-view";
import { OnboardingHeader } from "@/components/onboarding/onboarding-header";
import { Stack } from "expo-router";
import { View } from "react-native";

const OnboardingLayout = () => {
  return (
    <StyledSafeAreaView className="flex-1 px-4 gap-y-10">
      <OnboardingHeader />
      <View className="flex-1">
        <Stack
          screenOptions={{
            headerShown: false,
            headerBackButtonDisplayMode: "minimal",
            animation: "slide_from_right",
            animationMatchesGesture: true,
            animationTypeForReplace: "pop",
          }}
        >
          <Stack.Screen name="step1" />
          <Stack.Screen name="step2" />
          <Stack.Screen name="step3" />
        </Stack>
      </View>
      <OnboardingStepButton />
    </StyledSafeAreaView>
  );
};

export default OnboardingLayout;
