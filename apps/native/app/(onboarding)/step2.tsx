import { AnimatedText } from "@/components/animated-text";
import { AnimatedView } from "@/components/animated-view";
import { OnboardingCard } from "@/components/onboarding/onboarding-card";
import { StyledSymbolView } from "@/components/styled-symbol-view";
import { ThemedText } from "@/components/themed-text";
import { View } from "react-native";
import { FadeInDown, FadeInUp } from "react-native-reanimated";

const OnboardingStep2 = () => {
  return (
    <View>
      <OnboardingCard>
        <AnimatedView entering={FadeInUp.duration(500).delay(100)}>
          <View className="relative w-64 rotate-[-4deg] rounded-2xl bg-surface-secondary p-5 shadow-xl">
            <View className="mb-5 flex-row items-center justify-between">
              <ThemedText className="font-mono text-xs text-muted-foreground">
                MONTHLY LEDGER
              </ThemedText>
              <StyledSymbolView
                size={16}
                tintColorClassName="accent-foreground"
                name={{
                  android: "check",
                  ios: "checkmark",
                }}
              />
            </View>
            <View className="gap-y-3">
              <View className="h-2 w-4/5 rounded-full bg-surface-foreground/80" />
              <View className="h-2 w-3/5 rounded-full bg-surface-foreground/80" />
              <View className="h-2 w-full rounded-full bg-surface-foreground/60" />
            </View>
            <View className="mt-6 flex items-end justify-between">
              <ThemedText className="text-xs text-muted-foreground">
                Total saved
              </ThemedText>
              <ThemedText className="font-mono-semibold text-lg">
                रू 24,000
              </ThemedText>
            </View>
          </View>
        </AnimatedView>
      </OnboardingCard>
      <View className="gap-y-4">
        <AnimatedView
          entering={FadeInDown.duration(500)}
          className="flex-row items-center gap-2"
        >
          <StyledSymbolView
            tintColorClassName="accent-foreground"
            name={{
              android: "verified_user",
              ios: "checkmark.shield",
            }}
          />
          <ThemedText className="uppercase font-mono-semibold racking-[0.18em]">
            Clear by design
          </ThemedText>
        </AnimatedView>
        <AnimatedText
          entering={FadeInDown.duration(500).delay(300)}
          className="text-balance text-2xl text-foreground font-notosans-semibold leading-[1.08] tracking-tight"
        >
          Every rupee accounted for.
        </AnimatedText>
        <AnimatedText
          entering={FadeInDown.duration(500).delay(500)}
          className="max-w-sm text-pretty text-base leading-7 text-muted-foreground"
        >
          Track contributions, loans, and approvals with confidence — all in one
          place.
        </AnimatedText>
      </View>
    </View>
  );
};

export default OnboardingStep2;
