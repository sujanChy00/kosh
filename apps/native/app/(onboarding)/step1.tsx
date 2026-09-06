import { AnimatedText } from "@/components/animated-text";
import { AnimatedView } from "@/components/animated-view";
import { OnboardingCard } from "@/components/onboarding/onboarding-card";
import { StyledSymbolView } from "@/components/styled-symbol-view";
import { ThemedText } from "@/components/themed-text";
import { View } from "react-native";
import { FadeInDown, ZoomIn } from "react-native-reanimated";

const OnboardingStep1 = () => {
  return (
    <View>
      <OnboardingCard>
        <View className="flex-row items-end gap-3">
          <AnimatedView
            entering={ZoomIn.duration(500).delay(300)}
            className="mb-4 flex-row size-16 items-center justify-center rounded-2xl bg-surface-secondary shadow-sm"
          >
            <StyledSymbolView
              size={32}
              tintColorClassName="accent-muted"
              name={{
                android: "group",
                ios: "person.3",
              }}
            />
          </AnimatedView>
          <AnimatedView
            entering={ZoomIn.duration(500)}
            className="flex-row size-24 items-center justify-center rounded-3xl bg-primary  shadow-lg"
          >
            <StyledSymbolView
              size={48}

              tintColorClassName="accent-primary-foreground"
              name={{
                android: "group",
                ios: "person.3",
              }}
            />
          </AnimatedView>
          <AnimatedView
            entering={ZoomIn.duration(500).delay(300)}
            className="mb-8 flex-row size-14 items-center justify-center rounded-2xl bg-surface-secondary shadow-sm"
          >
            <StyledSymbolView
              size={28}
              tintColorClassName="accent-muted"
              name={{
                android: "group",
                ios: "person.3",
              }}
            />
          </AnimatedView>
        </View>
      </OnboardingCard>
      <View className="gap-y-4">
        <AnimatedView
          entering={FadeInDown.duration(500)}
          className="flex-row items-center gap-2"
        >
          <StyledSymbolView
            tintColorClassName="accent-foreground"
            name={{
              android: "group",
              ios: "person.3",
            }}
          />
          <ThemedText className="uppercase font-mono-semibold racking-[0.18em]">
            Together, we grow
          </ThemedText>
        </AnimatedView>
        <AnimatedText
          entering={FadeInDown.duration(500).delay(300)}
          className="text-balance text-2xl text-foreground font-notosans-semibold leading-[1.08] tracking-tight"
        >
          Your kosh, made simple.
        </AnimatedText>
        <AnimatedText
          entering={FadeInDown.duration(500).delay(500)}
          className="max-w-sm text-pretty text-base leading-7 text-muted-foreground"
        >
          Bring your community savings group into one secure, transparent space.
        </AnimatedText>
      </View>
    </View>
  );
};

export default OnboardingStep1;
