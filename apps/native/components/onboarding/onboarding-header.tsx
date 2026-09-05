import { View } from "react-native";
import { StyledImage } from "../styled-image";
import { ThemedText } from "../themed-text";

interface Props {
  activeStep: number;
}

export const OnboardingHeader = ({ activeStep }: Props) => {
  return (
    <View>
      <View className="flex-row justify-between items-center py-4">
        <View className="flex-row items-center gap-2">
          <StyledImage
            alt="Logo"
            source={require("@/assets/images/icon.png")}
            className="size-10"
          />
          <ThemedText className="text-lg font-notosans-medium">KOSH</ThemedText>
        </View>
        <ThemedText className="text-foreground font-mono-medium">
          {activeStep} / 03
        </ThemedText>
      </View>
      <View className="flex-row items-center gap-3">
        <View className="h-1.25 flex-1 rounded-full bg-primary" />
        <View className="h-1.25 flex-1 rounded-full bg-primary" />
        <View className="h-1.25 flex-1 rounded-full bg-primary" />
      </View>
    </View>
  );
};
