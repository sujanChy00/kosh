import { Icon, ListItem, Text } from "@expo/ui";
import {
  BasicAlertDialog,
  Column,
  Row,
  Spacer,
  Surface,
  TextButton,
} from "@expo/ui/jetpack-compose";
import {
  align,
  clip,
  height,
  padding,
  Shapes,
  wrapContentHeight,
  wrapContentWidth,
} from "@expo/ui/jetpack-compose/modifiers";
import { useState } from "react";
import { useCSSVariable } from "uniwind";

const LOGOUT_ICON = Icon.select({
  ios: "trash",
  android: require("@expo/material-symbols/delete.xml"),
});

export const DeleteAccount = () => {
  const [dangerColor] = useCSSVariable(["--color-danger"]) as [string];
  const [isVisible, setIsVisible] = useState(false);

  return (
    <>
      <ListItem
        onPress={() => {
          setIsVisible(true);
        }}
      >
        <Text
          textStyle={{
            color: dangerColor,
            fontFamily: "notosans-medium",
            fontSize: 15,
          }}
        >
          Delete Account
        </Text>
        <ListItem.Trailing>
          <Icon name={LOGOUT_ICON} size={18} color={dangerColor} />
        </ListItem.Trailing>
      </ListItem>
      {isVisible && (
        <BasicAlertDialog onDismissRequest={() => setIsVisible(false)}>
          <Surface
            tonalElevation={6}
            modifiers={[
              wrapContentWidth(),
              wrapContentHeight(),
              clip(Shapes.RoundedCorner(28)),
            ]}
          >
            <Column modifiers={[padding(16, 16, 16, 16)]}>
              <Text textStyle={{ fontSize: 20, fontWeight: "600" }}>
                Delete Account?
              </Text>
              <Spacer modifiers={[height(5)]} />
              <Text
                textStyle={{
                  fontSize: 14,
                }}
              >
                Are you sure you want to delete your account? This action cannot
                be undone and your account data will be permanently deleted.
              </Text>
              <Spacer modifiers={[height(24)]} />
              <Row modifiers={[align("end")]}>
                <TextButton onClick={() => setIsVisible(false)}>
                  <Text>Cancel</Text>
                </TextButton>
                <TextButton>
                  <Text
                    textStyle={{
                      color: dangerColor,
                    }}
                  >
                    Confirm
                  </Text>
                </TextButton>
              </Row>
            </Column>
          </Surface>
        </BasicAlertDialog>
      )}
    </>
  );
};
