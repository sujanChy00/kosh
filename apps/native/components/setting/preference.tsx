import { StyleSheet } from "react-native";

import { LanguageSelector } from "@/components/layout/language-selector";
import { LoginBiometricEnabler } from "@/components/setting/biometric-enabler";
import { ThemeToggler } from "@/components/setting/theme-toggler";
import { authClient } from "@/lib/auth-client";
import { errorToast } from "@/utils/toast";
import { Column, ListItem, Spacer, Text } from "@expo/ui";
import { HorizontalDivider } from "@expo/ui/jetpack-compose";
import { LanguageKey } from "@kosh-app/language";
import { useCSSVariable } from "uniwind";

export const Preference = () => {
  const [mutedColor] = useCSSVariable(["--color-muted"]) as [string];
  const handleLanguageChange = async (v: LanguageKey) => {
    await authClient.updateUser(
      {
        preferredLang: v,
      },
      {
        onError: (error) => {
          errorToast({
            title: error.error.message ?? "Failed to update language",
          });
        },
      },
    );
  };

  return (
    <Column>
      <Text
        style={{
          paddingHorizontal: 16,
        }}
        textStyle={{
          fontSize: 14,
          fontFamily: "notosans-regular",
          color: mutedColor,
        }}
      >
        Preferences
      </Text>
      <Spacer size={20} />
      <HorizontalDivider thickness={StyleSheet.hairlineWidth} />
      <ListItem>
        <Text
          textStyle={{
            fontFamily: "notosans-regular",
            fontSize: 15,
          }}
        >
          Language
        </Text>
        <ListItem.Trailing>
          <LanguageSelector
            onLanguageChange={handleLanguageChange}
            toLowerCase
            withIcon
            textStyle={{
              color: mutedColor,
              fontSize: 14,
            }}
          />
        </ListItem.Trailing>
      </ListItem>
      <ThemeToggler />
      <LoginBiometricEnabler />
    </Column>
  );
};
