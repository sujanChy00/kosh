import Constants from "expo-constants";
import { Linking, ScrollView, TouchableOpacity, View } from "react-native";

import { StyledSafeAreaView } from "@/components/layout/styled-safearea-view";
import { StyledImage } from "@/components/styled-image";
import { StyledSymbolView } from "@/components/styled-symbol-view";
import { ThemedText } from "@/components/themed-text";
import { SymbolViewProps } from "expo-symbols";

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
            icon={{
              android: "call",
              ios: "phone",
            }}
            label="Contact Support"
            onPress={() => Linking.openURL("mailto:support@koshapp.com")}
          />
          <AboutRow
            icon={{
              android: "open_in_new",
              ios: "arrow.up.right.square",
            }}
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
  icon,
}: {
  label: string;
  onPress: () => void;
  icon: SymbolViewProps["name"];
}) => (
  <TouchableOpacity
    className="w-full rounded-xl bg-surface-secondary px-4 py-3.5 active:opacity-70"
    onPress={onPress}
  >
    <View className="flex-row justify-between gap-3">
      <ThemedText className="text-sm font-notosans-medium text-foreground">
        {label}
      </ThemedText>
      <StyledSymbolView size={20} name={icon} />
    </View>
  </TouchableOpacity>
);

export default AboutScreen;
