import BELL_ICON from "@expo/material-symbols/notifications.xml";
import {
  Badge,
  BadgedBox,
  FilledTonalIconButton,
  Icon,
  Text,
} from "@expo/ui/jetpack-compose";
import { useRouter } from "expo-router";

import { Host } from "../layout/host";

export const NotificationButton = () => {
  const router = useRouter();
  return (
    <Host matchContents>
      <BadgedBox>
        <BadgedBox.Badge>
          <Badge>
            <Text
              style={{
                fontFamily: "mono-regular",
              }}
            >
              3
            </Text>
          </Badge>
        </BadgedBox.Badge>
        <FilledTonalIconButton onClick={() => router.push("/notification")}>
          <Icon source={BELL_ICON} />
        </FilledTonalIconButton>
      </BadgedBox>
    </Host>
  );
};
