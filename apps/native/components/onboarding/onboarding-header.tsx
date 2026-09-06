import { cn } from "@kosh-app/utils";
import { usePathname } from "expo-router";
import { useMemo } from "react";
import { View } from "react-native";
import { StyledImage } from "../styled-image";
import { ThemedText } from "../themed-text";

export const OnboardingHeader = () => {
  const pathname = usePathname();

  const activeStep = useMemo(() => {
    switch (pathname) {
      case "/step2":
        return 2;
      case "/step3":
        return 3;
      default:
        return 1;
    }
  }, [pathname]);

  return (
    <View>
      <View className="flex-row justify-between items-center py-6">
        <View className="flex-row items-center gap-2">
          <StyledImage
            alt="Logo"
            source={require("@/assets/images/icon.png")}
            className="size-10"
          />
          <ThemedText className="text-lg font-notosans-semibold">
            KOSH
          </ThemedText>
        </View>
        <ThemedText className="text-foreground font-mono-medium">
          {activeStep} / 03
        </ThemedText>
      </View>
      <View className="flex-row items-center gap-3">
        <View
          className={cn(
            "h-1.25 flex-1 rounded-full",
            activeStep === 1 ? "bg-primary" : "bg-surface-tertiary",
          )}
        />
        <View
          className={cn(
            "h-1.25 flex-1 rounded-full",
            activeStep === 2 ? "bg-primary" : "bg-surface-tertiary",
          )}
        />
        <View
          className={cn(
            "h-1.25 flex-1 rounded-full",
            activeStep === 3 ? "bg-primary" : "bg-surface-tertiary",
          )}
        />
      </View>
    </View>
  );
};
