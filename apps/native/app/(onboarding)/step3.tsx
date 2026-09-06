import { AnimatedText } from "@/components/animated-text";
import { AnimatedView } from "@/components/animated-view";
import { OnboardingCard } from "@/components/onboarding/onboarding-card";
import { StyledSymbolView } from "@/components/styled-symbol-view";
import { ThemedText } from "@/components/themed-text";
import { useLanguage } from "@/hooks/use-language";
import { cn, LANG_OPTIONS } from "@kosh-app/utils";
import { TouchableOpacity, View } from "react-native";
import { FadeInDown, FadeOut, ZoomIn } from "react-native-reanimated";

const OnboardingStep3 = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <View>
      <OnboardingCard>
        <View className="gap-3 w-full items-center">
          {LANG_OPTIONS.map((lang, index) => (
            <AnimatedView
              key={lang.value}
              entering={ZoomIn.duration(400).delay(index > 0 ? 200 : 100)}
              className={"w-full px-10"}
            >
              <TouchableOpacity
                onPress={() => {
                  setLanguage(lang.value);
                }}
                className={cn(
                  "bg-surface-secondary rounded-2xl px-3 py-4 border-2",
                  lang.value === language
                    ? "border-primary"
                    : "border-surface-secondary",
                )}
              >
                <View className="flex-row items-center justify-between">
                  <ThemedText className="flex-1">
                    {lang.flag} {lang.label}
                  </ThemedText>
                  {lang.value === language && (
                    <AnimatedView
                      entering={ZoomIn.duration(200)}
                      exiting={FadeOut.duration(100)}
                    >
                      <StyledSymbolView
                        tintColorClassName="accent-primary"
                        name={{
                          android: "check_circle_outline",
                          ios: "checkmark.circle.fill",
                        }}
                      />
                    </AnimatedView>
                  )}
                </View>
              </TouchableOpacity>
            </AnimatedView>
          ))}
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
              android: "language",
              ios: "globe",
            }}
          />
          <ThemedText className="uppercase font-mono-semibold racking-[0.18em]">
            Make it yours
          </ThemedText>
        </AnimatedView>
        <AnimatedText
          entering={FadeInDown.duration(500).delay(300)}
          className="text-balance text-2xl text-foreground font-notosans-semibold leading-[1.08] tracking-tight"
        >
          Choose your language.
        </AnimatedText>
        <AnimatedText
          entering={FadeInDown.duration(500).delay(500)}
          className="max-w-sm text-pretty text-base leading-7 text-muted-foreground"
        >
          Kosh App is built for your community. Select the language you feel
          most comfortable using.
        </AnimatedText>
      </View>
    </View>
  );
};

export default OnboardingStep3;
