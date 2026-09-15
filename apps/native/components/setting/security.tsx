import { StyleSheet } from "react-native";

import { Column } from "@expo/ui";
import { HorizontalDivider } from "@expo/ui/jetpack-compose";
import { DeleteAccountAlert } from "./delete-account-alert";
import { LogoutAlert } from "./logout-alert";

export const Security = () => {
  return (
    <Column>
      <HorizontalDivider thickness={StyleSheet.hairlineWidth} />
      <LogoutAlert />
      <DeleteAccountAlert />
    </Column>
  );
};
