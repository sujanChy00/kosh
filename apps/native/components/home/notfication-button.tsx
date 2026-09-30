import { useNotificationUnreadCount } from "@/hooks/use-notification-feed";
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

/** Anything above this is noise; every inbox caps the way this does. */
const MAX_BADGE_COUNT = 99;

export const NotificationButton = () => {
  const router = useRouter();
  const unread = useNotificationUnreadCount();

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
              {unread > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : unread}
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
