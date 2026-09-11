import { StyleSheet } from "react-native";

import CHEVRON_RIGHT from "@expo/material-symbols/chevron_right.xml";
import GROUP_ICON from "@expo/material-symbols/groups.xml";
import LOCK_ICON from "@expo/material-symbols/lock_reset.xml";
import ACCOUNT_ICON from "@expo/material-symbols/manage_accounts.xml";
import PAYMENT_ICON from "@expo/material-symbols/payments.xml";
import SAVING_ICON from "@expo/material-symbols/savings.xml";
import { Column, Icon, ListItem, Spacer, Text } from "@expo/ui";
import { HorizontalDivider } from "@expo/ui/jetpack-compose";
import { useRouter } from "expo-router";
import { useCSSVariable } from "uniwind";

export const ProfileLinks = () => {
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
        Profile
      </Text>
      <Spacer size={20} />
      <HorizontalDivider thickness={StyleSheet.hairlineWidth} />
      <ListItem
        onPress={() => {
          router.push("/setting/update-profile");
        }}
      >
        <ListItem.Leading>
          <Icon name={ACCOUNT_ICON} />
        </ListItem.Leading>
        <Text
          textStyle={{
            fontFamily: "notosans-regular",
            fontSize: 15,
          }}
        >
          Update Profile
        </Text>
        <ListItem.Trailing>
          <Icon name={CHEVRON_RIGHT} color={mutedColor} size={18} />
        </ListItem.Trailing>
      </ListItem>
      <ListItem
        onPress={() => {
          router.push("/setting/update-password");
        }}
      >
        <ListItem.Leading>
          <Icon name={LOCK_ICON} />
        </ListItem.Leading>
        <Text
          textStyle={{
            fontFamily: "notosans-regular",
            fontSize: 15,
          }}
        >
          Update Password
        </Text>
        <ListItem.Trailing>
          <Icon name={CHEVRON_RIGHT} color={mutedColor} size={18} />
        </ListItem.Trailing>
      </ListItem>
      <ListItem
        onPress={() => {
          router.push("/kosh");
        }}
      >
        <ListItem.Leading>
          <Icon name={GROUP_ICON} />
        </ListItem.Leading>
        <Text
          textStyle={{
            fontFamily: "notosans-regular",
            fontSize: 15,
          }}
        >
          My Kosh
        </Text>
        <ListItem.Trailing>
          <Icon name={CHEVRON_RIGHT} color={mutedColor} size={18} />
        </ListItem.Trailing>
      </ListItem>
      <ListItem
        onPress={() => {
          router.push("/loan");
        }}
      >
        <ListItem.Leading>
          <Icon name={PAYMENT_ICON} />
        </ListItem.Leading>
        <Text
          textStyle={{
            fontFamily: "notosans-regular",
            fontSize: 15,
          }}
        >
          My Loans
        </Text>
        <ListItem.Trailing>
          <Icon name={CHEVRON_RIGHT} color={mutedColor} size={18} />
        </ListItem.Trailing>
      </ListItem>
      <ListItem
        onPress={() => {
          router.push("/contribution");
        }}
      >
        <ListItem.Leading>
          <Icon name={SAVING_ICON} />
        </ListItem.Leading>
        <Text
          textStyle={{
            fontFamily: "notosans-regular",
            fontSize: 15,
          }}
        >
          My Contributions
        </Text>
        <ListItem.Trailing>
          <Icon name={CHEVRON_RIGHT} color={mutedColor} size={18} />
        </ListItem.Trailing>
      </ListItem>
    </Column>
  );
};
