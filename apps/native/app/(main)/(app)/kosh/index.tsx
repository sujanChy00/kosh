import { JoinNewKoshDialog } from "@/components/kosh/join-new-kosh-dialog";
import { KoshList } from "@/components/kosh/kosh-list";
import ADD_ICON from "@expo/material-symbols/add.xml";
import RECORD_ICON from "@expo/material-symbols/edit_square.xml";
import JOIN_ICON from "@expo/material-symbols/group_add.xml";
import HOW_TO_REG_ICON from "@expo/material-symbols/how_to_reg.xml";
import MORE_HORIZ_ICON from "@expo/material-symbols/more_horiz.xml";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

const KoshScreen = () => {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  return (
    <View className="flex-1">
      <JoinNewKoshDialog
        isVisible={isVisible}
        setIsVisible={setIsVisible}
        onConfirm={(token) => {
          router.push({
            pathname: "/kosh/join",
            params: { token },
          });
        }}
      />
      <Stack.Title>My Kosh</Stack.Title>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu>
          <Stack.Toolbar.Icon sf="ellipsis.circle" src={MORE_HORIZ_ICON} />

          <Stack.Toolbar.MenuAction
            icon={HOW_TO_REG_ICON}
            onPress={() => {
              router.push({
                pathname: "/join-requests",
              });
            }}
          >
            Join Requests
          </Stack.Toolbar.MenuAction>

          <Stack.Toolbar.MenuAction
            icon={JOIN_ICON}
            onPress={() => {
              setIsVisible(true);
            }}
          >
            Join New Kosh
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction
            icon={RECORD_ICON}
            onPress={() => {
              router.push({
                pathname: "/contribution",
              });
            }}
          >
            Contribution
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction
            icon={ADD_ICON}
            onPress={() => {
              router.push({
                pathname: "/kosh/add",
              });
            }}
          >
            Add
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
      <KoshList />
    </View>
  );
};

export default KoshScreen;
