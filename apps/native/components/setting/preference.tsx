import { StyleSheet } from "react-native";

import { LanguageSelector } from "@/components/layout/language-selector";
import { LoginBiometricEnabler } from "@/components/setting/biometric-enabler";
import { ThemeToggler } from "@/components/setting/theme-toggler";
import { authClient } from "@/lib/auth-client";
import { Column, ListItem, Spacer, Text } from "@expo/ui";
import { HorizontalDivider } from "@expo/ui/jetpack-compose";
import { LanguageKey } from "@kosh-app/language";
import { toast } from "@/components/ui/Toast/toast.store";
import { useCSSVariable } from "uniwind";

export const Preference = () => {
  const [mutedColor] = useCSSVariable(["--color-muted"]) as [string];
  const handleLanguageChange = async (v: LanguageKey) => {
    try {
      await authClient.updateUser({
        preferredLang: v,
      });
    } catch {
      toast.error("Failed to update language");
    }
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
