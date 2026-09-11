import { StyleSheet } from "react-native";

import CHEVRON_RIGHT from "@expo/material-symbols/chevron_right.xml";
import TERMS_ICON from "@expo/material-symbols/description.xml";
import INFO_ICON from "@expo/material-symbols/info.xml";
import PRIVACY_ICON from "@expo/material-symbols/privacy_tip.xml";
import { Column, Icon, ListItem, Spacer, Text } from "@expo/ui";
import { HorizontalDivider } from "@expo/ui/jetpack-compose";
import { useRouter } from "expo-router";
import { useCSSVariable } from "uniwind";

export const LegalInfo = () => {
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
        Legal Info
      </Text>
      <Spacer size={20} />
      <HorizontalDivider thickness={StyleSheet.hairlineWidth} />
      <ListItem
        onPress={() => {
          router.push("/privacy-policy");
        }}
      >
        <ListItem.Leading>
          <Icon name={PRIVACY_ICON} />
        </ListItem.Leading>
        <Text
          textStyle={{
            fontFamily: "notosans-regular",
            fontSize: 15,
          }}
        >
          Privacy Policy
        </Text>
        <ListItem.Trailing>
          <Icon name={CHEVRON_RIGHT} color={mutedColor} size={18} />
        </ListItem.Trailing>
      </ListItem>
      <ListItem
        onPress={() => {
          router.push("/terms-conditions");
        }}
      >
        <ListItem.Leading>
          <Icon name={TERMS_ICON} />
        </ListItem.Leading>
        <Text
          textStyle={{
            fontFamily: "notosans-regular",
            fontSize: 15,
          }}
        >
          Terms & Conditions
        </Text>
        <ListItem.Trailing>
          <Icon name={CHEVRON_RIGHT} color={mutedColor} size={18} />
        </ListItem.Trailing>
      </ListItem>
      <ListItem
        onPress={() => {
          router.push("/about");
        }}
      >
        <ListItem.Leading>
          <Icon name={INFO_ICON} />
        </ListItem.Leading>
        <Text
          textStyle={{
            fontFamily: "notosans-regular",
            fontSize: 15,
          }}
        >
          About
        </Text>
        <ListItem.Trailing>
          <Icon name={CHEVRON_RIGHT} color={mutedColor} size={18} />
        </ListItem.Trailing>
      </ListItem>
    </Column>
  );
};
