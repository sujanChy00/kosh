import { authClient } from "@/lib/auth-client";
import { storage } from "@/utils/storage";
import { errorToast, successToast } from "@/utils/toast";
import { queryClient } from "@/utils/trpc";
import { Icon, ListItem, Text } from "@expo/ui";
import {
  BasicAlertDialog,
  Column,
  IconToggleButton,
  Row,
  Spacer,
  Surface,
  TextButton,
  TextField,
  useNativeState,
} from "@expo/ui/jetpack-compose";
import {
  align,
  clip,
  fillMaxWidth,
  height,
  padding,
  Shapes,
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
              <Text textStyle={{ fontSize: 20, fontWeight: "600" }}>
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
              <TextField
                autoFocus
                value={password}
                onValueChange={handleValueChange}
                visualTransformation={showPassword ? "none" : "password"}
                modifiers={[fillMaxWidth()]}
              >
                <TextField.Label>
                  <Text>Your Password</Text>
                </TextField.Label>
                <TextField.TrailingIcon>
                  <IconToggleButton
                    checked={showPassword}
                    onCheckedChange={setShowPassword}
                  >
                    <Icon
                    
                      name={showPassword ? VISIBLITY_ON : VISIBLITY_OFF}
                      size={24}
                    />
                  </IconToggleButton>
                </TextField.TrailingIcon>
              </TextField>

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
