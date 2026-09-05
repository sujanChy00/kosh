import { StyledSafeAreaView } from "@/components/layout/styled-safearea-view";
import { OnboardingHeader } from "@/components/onboarding/onboarding-header";
import { ThemedText } from "@/components/themed-text";
import { Link } from "expo-router";

const OnboardingStep2 = () => {
  return (
    <StyledSafeAreaView className="flex-1 px-4 gap-y-10">
      <OnboardingHeader activeStep={2} />
      <Link
        href={{
          pathname: "/step3",
        }}
      >
        <ThemedText>Step3</ThemedText>
      </Link>
    </StyledSafeAreaView>
  );
};

export default OnboardingStep2;
