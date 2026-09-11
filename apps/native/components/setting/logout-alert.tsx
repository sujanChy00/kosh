import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/trpc";
import { Icon, ListItem, Text } from "@expo/ui";
import { AlertDialog, TextButton } from "@expo/ui/jetpack-compose";
import { useCallback, useState } from "react";
import { useCSSVariable } from "uniwind";

const LOGOUT_ICON = Icon.select({
  ios: "chevron.right",
  android: require("@expo/material-symbols/logout.xml"),
});

export const LogoutAlert = () => {
  const [dangerColor] = useCSSVariable(["--color-danger"]) as [string];
  const [isVisible, setIsVisible] = useState(false);

  const onLogout = useCallback(() => {
    authClient.signOut();
    queryClient.invalidateQueries();
    setIsVisible(false);
  }, []);

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
          Logout
        </Text>
        <ListItem.Trailing>
          <Icon name={LOGOUT_ICON} size={18} color={dangerColor} />
        </ListItem.Trailing>
      </ListItem>
      {isVisible && (
        <AlertDialog onDismissRequest={() => setIsVisible(false)}>
          <AlertDialog.Title>
            <Text
              textStyle={{
                fontSize: 20,
              }}
            >
              Log out?
            </Text>
          </AlertDialog.Title>

          <AlertDialog.Text>
            <Text>Are you sure you want to log out of your account?</Text>
          </AlertDialog.Text>
          <AlertDialog.DismissButton>
            <TextButton onClick={() => setIsVisible(false)}>
              <Text>Cancel</Text>
            </TextButton>
          </AlertDialog.DismissButton>
          <AlertDialog.ConfirmButton>
            <TextButton onClick={onLogout}>
              <Text
                textStyle={{
                  color: dangerColor,
                }}
              >
                OK
              </Text>
            </TextButton>
          </AlertDialog.ConfirmButton>
        </AlertDialog>
      )}
    </>
  );
};
