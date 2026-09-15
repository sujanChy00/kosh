import { authClient } from "@/lib/auth-client";
import CHEVRON_RIGHT from "@expo/material-symbols/chevron_right.xml";
import { Column, Spacer } from "@expo/ui";
import { Box, Icon, Image, Row, Text } from "@expo/ui/jetpack-compose";
import {
  align,
  background,
  clickable,
  clip,
  padding,
  Shapes,
  size,
  weight,
} from "@expo/ui/jetpack-compose/modifiers";
import { getAvatarName } from "@kosh-app/utils";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCSSVariable } from "uniwind";

export const ProfileHeader = () => {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const [mutedColor, surfaceSecondary] = useCSSVariable([
    "--color-muted",
    "--color-surface-secondary",
  ]) as [string, string];
  const { data } = authClient.useSession();
  const user = data?.user;
  return (
    <Row
      verticalAlignment="center"
      modifiers={[
        padding(12, top + 20, 12, 20),
        clickable(() => router.push("/profile")),
      ]}
    >
      <Row verticalAlignment="center" modifiers={[weight(1)]}>
        {!!user?.image ? (
          <Image
            contentScale="crop"
            contentDescription={user?.name}
            modifiers={[size(50, 50), clip(Shapes.Circle)]}
            source={{ uri: user.image }}
          />
        ) : (
          <Box
            modifiers={[
              size(50, 50),
              clip(Shapes.Circle),
              background(surfaceSecondary),
            ]}
          >
            <Text modifiers={[align("center")]} style={{ textAlign: "center" }}>
              {getAvatarName(user?.name)}
            </Text>
          </Box>
        )}

        <Spacer size={10} />
        <Column modifiers={[weight(1)]}>
          <Text
            style={{ fontSize: 18, fontFamily: "notosans-medium" }}
            maxLines={1}
            overflow="ellipsis"
          >
            {user?.name}
          </Text>
          <Text
            color={mutedColor}
            style={{ fontFamily: "notosans-regular", fontSize: 13 }}
            maxLines={1}
            overflow="ellipsis"
          >
            {user?.email}
          </Text>
        </Column>
      </Row>
      <Spacer size={10} />
      <Icon size={18} source={CHEVRON_RIGHT} />
    </Row>
  );
};
