import { Host } from "@/components/layout/host";
import { LanguageSelector } from "@/components/layout/language-selector";
import { StyledImage } from "@/components/styled-image";
import { ThemedText } from "@/components/themed-text";
import { Stack } from "expo-router";
import { View } from "react-native";

const AuthLayout = () => {
  return (
    <View className="pt-safe-offset-14 flex-1">
      <View className="flex-row items-center justify-between px-4 border-b-hairline pb-2 border-b-separator">
        <View className="flex-row items-center gap-2">
          <StyledImage
            source={require("@/assets/images/icon.png")}
            className="size-10"
          />
          <ThemedText className="font-mono-semibold text-base">KOSH</ThemedText>
        </View>
        <Host matchContents>
          <LanguageSelector
            textStyle={{
              fontFamily: "mono-medium",
            }}
          />
        </Host>
      </View>
      <Stack
        screenOptions={{
          headerShown: false,
          headerBackButtonDisplayMode: "minimal",
        }}
      >
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="verify-email" />
      </Stack>
    </View>
  );
};

export default AuthLayout;
