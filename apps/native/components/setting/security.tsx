import { StyleSheet } from "react-native";

import { Column, Spacer, Text } from "@expo/ui";
import { HorizontalDivider } from "@expo/ui/jetpack-compose";
import { useRouter } from "expo-router";
import { useCSSVariable } from "uniwind";
import { DeleteAccountAlert } from "./delete-account-alert";
import { LogoutAlert } from "./logout-alert";

export const Security = () => {
  const [mutedColor] = useCSSVariable(["--color-muted"]) as [string];
  const router = useRouter();
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
        Security
      </Text>
      <Spacer size={20} />
      <HorizontalDivider thickness={StyleSheet.hairlineWidth} />
      <LogoutAlert />
      <DeleteAccountAlert />
    </Column>
  );
};
