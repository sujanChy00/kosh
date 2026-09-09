import { usePasskeyBiometrics } from "@/hooks/use-passkey-biometrics";

import { Alert, StyleSheet } from "react-native";

import { Host } from "@/components/layout/host";
import { StyledSafeAreaView } from "@/components/layout/styled-safearea-view";
import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/trpc";
import { Icon, List, ListItem, Spacer, Switch, Text } from "@expo/ui";
import {
  CircularProgressIndicator,
  HorizontalDivider,
} from "@expo/ui/jetpack-compose";
import { size } from "@expo/ui/jetpack-compose/modifiers";
import { useCallback } from "react";
import { useCSSVariable } from "uniwind";

const CHEVRON_RIGHT = Icon.select({
  ios: "chevron.right",
  android: require("@expo/material-symbols/chevron_right.xml"),
});

const LOGOUT_ICON = Icon.select({
  ios: "chevron.right",
  android: require("@expo/material-symbols/logout.xml"),
});

const SettingsScreen = () => {
  const { isAvailable, isEnabled, isPending, toggle } = usePasskeyBiometrics();
  const [dangerColor] = useCSSVariable(["--color-danger"]) as [string];

  const onLogout = useCallback(() => {
    Alert.alert("Logout", "Are you sure you want to logout", [
      {
        text: "cancel",
        style: "cancel",
      },
      {
        onPress: () => {
          authClient.signOut();
          queryClient.invalidateQueries();
        },
        style: "destructive",
        text: "Logout",
      },
    ]);
  }, []);

  return (
    <StyledSafeAreaView className="flex-1">
      <Host style={{ flex: 1 }}>
        <List>
          <Text
            style={{
              paddingHorizontal: 16,
            }}
            textStyle={{
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            Preferences
          </Text>
          <Spacer size={20} />
          <HorizontalDivider thickness={StyleSheet.hairlineWidth} />
          <ListItem>
            <Text
              textStyle={{
                fontFamily: "notosans-medium",
                fontSize: 15,
              }}
            >
              Biometric Login
            </Text>
            <ListItem.Supporting>
              <Text
                textStyle={{
                  fontSize: 12,
                }}
              >
                {isAvailable
                  ? "Unlock Kosh with Face ID or your fingerprint. \nA passkey is saved securely on this device."
                  : "Face ID or fingerprint is not set up on this device."}
              </Text>
            </ListItem.Supporting>
            <ListItem.Trailing>
              {isPending ? (
                <CircularProgressIndicator
                  strokeWidth={3}
                  modifiers={[size(25, 25)]}
                />
              ) : (
                <Switch
                  onValueChange={toggle}
                  value={isEnabled}
                  disabled={!isAvailable}
                />
              )}
            </ListItem.Trailing>
          </ListItem>
          <ListItem
            onPress={() => {
              onLogout();
            }}
          >
            <Text
              textStyle={{
                color: dangerColor,
                fontFamily: "notosans-medium",
                fontSize: 15,
              }}
            >
              Logout
            </Text>
            <ListItem.Trailing>
              <Icon name={LOGOUT_ICON} size={18} color={dangerColor} />
            </ListItem.Trailing>
          </ListItem>
        </List>
      </Host>
    </StyledSafeAreaView>
  );
};

export default SettingsScreen;
