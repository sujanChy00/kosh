import Constants from "expo-constants";
import { Linking, ScrollView, TouchableOpacity, View } from "react-native";

import { StyledSafeAreaView } from "@/components/layout/styled-safearea-view";
import { StyledImage } from "@/components/styled-image";
import { ThemedText } from "@/components/themed-text";

const AboutScreen = () => {
  const version = Constants.expoConfig?.version ?? "1.0.0";
  const buildNumber =
    Constants.expoConfig?.android?.versionCode ??
    Constants.expoConfig?.ios?.buildNumber ??
    "";

  return (
    <StyledSafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="flex-1 items-center px-6 pt-16 pb-8">
        <View className="items-center gap-y-4">
          <StyledImage
            source={require("@/assets/images/icon.png")}
            className="h-20 w-20 rounded-2xl"
          />
          <View className="items-center gap-y-1">
            <ThemedText className="text-2xl font-notosans-bold text-foreground">
              Kosh
            </ThemedText>
            <ThemedText className="text-sm font-notosans-medium text-muted text-center">
              Digital savings & loans for your community kosh
            </ThemedText>
          </View>
        </View>

        <View className="mt-10 w-full gap-y-1 items-center">
          <ThemedText className="text-xs font-mono-regular text-muted">
            Version {version}
            {buildNumber ? ` (${buildNumber})` : ""}
          </ThemedText>
        </View>

        <View className="mt-10 w-full gap-y-3">
          <AboutRow
            label="Contact Support"
            onPress={() => Linking.openURL("mailto:support@koshapp.com")}
          />
          <AboutRow
            label="Visit Website"
            onPress={() => Linking.openURL("https://koshapp.com")}
          />
        </View>

        <View className="flex-1" />

        <ThemedText className="text-xs font-notosans-regular text-muted text-center mt-10">
          Built for community savings groups in Nepal.{"\n"}©{" "}
          {new Date().getFullYear()} Kosh App. All rights reserved.
        </ThemedText>
      </ScrollView>
    </StyledSafeAreaView>
  );
};

const AboutRow = ({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) => (
  <TouchableOpacity
    className="w-full rounded-xl bg-surface-secondary px-4 py-3.5 active:opacity-70"
    onPress={onPress}
  >
    <ThemedText className="text-sm font-notosans-medium text-foreground">
      {label}
    </ThemedText>
  </TouchableOpacity>
);

export default AboutScreen;
