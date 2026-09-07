import { useOnboarding } from "@/hooks/use-onboarding";
import { usePathname, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { View } from "react-native";
import { StyledSymbolView } from "../styled-symbol-view";
import { OutlineButton, PrimaryButton } from "../ui/button";

export const OnboardingStepButton = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { setIsOnboardingCompleted } = useOnboarding();

  const onContinue = useCallback(() => {
    switch (pathname) {
      case "/step1":
        router.push("/step2");
        break;

      case "/step2":
        router.push("/step3");
        break;

      case "/step3":
        setIsOnboardingCompleted(true);
        router.replace("/sign-in");

        break;
    }
  }, [pathname]);

  const buttonText = useMemo(() => {
    if (pathname === "/step3") return "Get Started";
    return "Continue";
  }, [pathname]);

  return (
    <View className="flex-row items-center gap-3">
      {pathname !== "/step1" && (
        <OutlineButton
          onPress={() => {
            router.back();
          }}
        >
          <StyledSymbolView
            tintColorClassName="accent-muted"
            name={{
              android: "arrow_left_alt",
            }}
          />
        </OutlineButton>
      )}
      <PrimaryButton
        wrapperClassName="flex-1"
        onPress={() => {
          onContinue();
        }}
      >
        <PrimaryButton.Label>{buttonText}</PrimaryButton.Label>
        <StyledSymbolView
          tintColorClassName="accent-primary-foreground"
          name={{
            android: "arrow_right_alt",
          }}
        />
      </PrimaryButton>
    </View>
  );
};
