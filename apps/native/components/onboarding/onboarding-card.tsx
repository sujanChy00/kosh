import { cn } from "@kosh-app/utils";
import { View, ViewProps } from "react-native";

export const OnboardingCard = ({ className, children }: ViewProps) => {
  return (
    <View
      className={cn(
        "relative mb-10 flex-row h-64 items-center justify-center overflow-hidden rounded-4xl bg-surface",
        className,
      )}
    >
      <View className="absolute -right-12 -top-14 size-40 rounded-full border-18 border-primary/30" />
      <View className="absolute -bottom-20 -left-10 size-48 rounded-full border-26 border-primary/10" />
      {children}
    </View>
  );
};
