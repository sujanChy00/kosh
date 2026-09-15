import { useAppTheme } from "@/contexts/app-theme-context";
import { authClient } from "@/lib/auth-client";
import { storage } from "@/utils/storage";
import { errorToast, successToast } from "@/utils/toast";
import { queryClient } from "@/utils/trpc";
import { Icon, ListItem, Text } from "@expo/ui";
import {
  BasicAlertDialog,
  BasicTextField,
  Box,
  Column,
  IconToggleButton,
  Row,
  Spacer,
  Surface,
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
import { LOGIN_BIOMETRIC_ENABLED } from "@kosh-app/utils/constants/data";
import { useCallback, useState } from "react";
import { useCSSVariable } from "uniwind";

const LOGOUT_ICON = Icon.select({
  ios: "trash",
  android: require("@expo/material-symbols/delete.xml"),
});

const VISIBLITY_ON = Icon.select({
  ios: "eye",
  android: require("@expo/material-symbols/visibility.xml"),
});
const VISIBLITY_OFF = Icon.select({
  ios: "eye.slash",
  android: require("@expo/material-symbols/visibility_off.xml"),
});

export const DeleteAccountAlert = () => {
  const { colors } = useAppTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const password = useNativeState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [dangerColor] = useCSSVariable(["--color-danger"]) as [string];

  const handleValueChange = useCallback(
    (value: string) => {
      "worklet";
      password.value = value;
    },
    [password],
  );

  const onDelete = async () => {
    if (!password.value) {
      errorToast({ title: "Please enter your password" });
      return;
    }
    setIsDeleting(true);
    try {
      await authClient.deleteUser(
        { password: password.value },
        {
          onError(error) {
            errorToast({
              title: error.error?.message || "Failed to delete account",
            });
          },
          onSuccess() {
            storage.remove(LOGIN_BIOMETRIC_ENABLED);
            queryClient.invalidateQueries();
            setIsVisible(false);
            password.value = "";
            successToast({ title: "Account deleted successfully" });
          },
        },
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <ListItem
        onPress={() => {
          password.value = "";
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
        <BasicAlertDialog
          onDismissRequest={() => !isDeleting && setIsVisible(false)}
        >
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
                textStyle={{
                  fontSize: 20,
                  fontWeight: "600",
                  fontFamily: "notosans-regular",
                }}
              >
                Delete Account?
              </Text>
              <Spacer modifiers={[height(10)]} />
              <Text
                textStyle={{
                  fontSize: 14,
                }}
              >
                This action is irreversible. Your account and all associated
                data will be permanently deleted.
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
                <TextButton onClick={onDelete}>
                  <Text
                    textStyle={{
                      color: isDeleting ? "#999" : dangerColor,
                    }}
                  >
                    {isDeleting ? "Deleting..." : "Confirm"}
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
