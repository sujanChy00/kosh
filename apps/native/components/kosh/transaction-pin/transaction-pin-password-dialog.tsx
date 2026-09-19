import { Host } from "@/components/layout/host";
import { useAppTheme } from "@/contexts/app-theme-context";
import { Icon } from "@expo/ui";
import {
  BasicAlertDialog,
  BasicTextField,
  Box,
  Button,
  Column,
  IconToggleButton,
  Row,
  Spacer,
  Surface,
  Text,
  TextButton,
  useNativeState,
} from "@expo/ui/jetpack-compose";
import {
  align,
  background,
  clip,
  dropShadow,
  fillMaxWidth,
  height,
  padding,
  Shapes,
  weight,
  wrapContentHeight,
  wrapContentWidth,
} from "@expo/ui/jetpack-compose/modifiers";
import { useCallback, useState } from "react";
const VISIBLITY_ON = Icon.select({
  ios: "eye",
  android: require("@expo/material-symbols/visibility.xml"),
});
const VISIBLITY_OFF = Icon.select({
  ios: "eye.slash",
  android: require("@expo/material-symbols/visibility_off.xml"),
});

interface Props {
  onConfirm: (value: string) => void;
  isVisible: boolean;
  setIsVisible: React.Dispatch<React.SetStateAction<boolean>>;
  confirmButtonText?: string;
}

export const TransactionPinPasswordDialog = ({
  onConfirm,
  isVisible,
  setIsVisible,
  confirmButtonText = "Confirm",
}: Props) => {
  const { colors } = useAppTheme();
  const [showPassword, setShowPassword] = useState(false);
  const password = useNativeState("");

  const handleValueChange = useCallback(
    (value: string) => {
      "worklet";
      password.value = value;
    },
    [password],
  );

  return (
    <Host matchContents>
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
            <Column modifiers={[padding(25, 25, 25, 25)]}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "600",
                  fontFamily: "notosans-regular",
                }}
              >
                Enter your password
              </Text>
              <Spacer modifiers={[height(10)]} />
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "notosans-regular",
                }}
              >
                In order to confirm, please enter your password.
              </Text>
              <Spacer modifiers={[height(16)]} />
              <Row
                verticalAlignment="center"
                modifiers={[
                  clip(Shapes.RoundedCorner(16)),
                  dropShadow(Shapes.Rectangle, {
                    radius: 3,
                    spread: 0,
                    offsetX: 0,
                    offsetY: 1,
                    color: "#000000",
                    alpha: 0.1,
                  }),
                  dropShadow(Shapes.Rectangle, {
                    radius: 2,
                    spread: -1,
                    offsetX: 0,
                    offsetY: 1,
                    color: "#000000",
                    alpha: 0.1,
                  }),
                  background(colors.background),
                  fillMaxWidth(),
                ]}
              >
                <BasicTextField
                  autoFocus
                  value={password}
                  onValueChange={handleValueChange}
                  visualTransformation={showPassword ? "none" : "password"}
                  modifiers={[
                    weight(1),
                    clip(Shapes.RoundedCorner(16)),
                    padding(12, 16, 12, 16),
                  ]}
                >
                  <BasicTextField.DecorationBox>
                    <Box>
                      <BasicTextField.Placeholder>
                        <Text>********</Text>
                      </BasicTextField.Placeholder>
                      <BasicTextField.InnerTextField />
                    </Box>
                  </BasicTextField.DecorationBox>
                </BasicTextField>
                <IconToggleButton
                  checked={showPassword}
                  onCheckedChange={setShowPassword}
                >
                  <Icon
                    name={showPassword ? VISIBLITY_ON : VISIBLITY_OFF}
                    size={24}
                  />
                </IconToggleButton>
              </Row>

              <Spacer modifiers={[height(24)]} />
              <Row modifiers={[align("end")]}>
                <TextButton onClick={() => setIsVisible(false)}>
                  <Text>Cancel</Text>
                </TextButton>
                <Button onClick={() => onConfirm(password.value)}>
                  <Text>{confirmButtonText ?? "Confirm"}</Text>
                </Button>
              </Row>
            </Column>
          </Surface>
        </BasicAlertDialog>
      )}
    </Host>
  );
};
