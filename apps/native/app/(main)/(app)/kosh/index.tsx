import { KoshJoinDialog } from "@/components/kosh/kosh-join-dialog";
import { KoshList } from "@/components/kosh/kosh-list";
import PLUST_ICON from "@expo/material-symbols/add.xml";
import RECORD_ICON from "@expo/material-symbols/edit_square.xml";
import JOIN_ICON from "@expo/material-symbols/group_add.xml";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

const KoshScreen = () => {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  return (
    <View className="flex-1">
      <KoshJoinDialog
        isVisible={isVisible}
        setIsVisible={setIsVisible}
        onConfirm={(token) => {
          router.push({
            pathname: "/join",
            params: { token },
          });
        }}
      />
      <Stack.Title>My Kosh</Stack.Title>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          onPress={() => {
            setIsVisible(true);
          }}
          variant="prominent"
        >
          <Stack.Toolbar.Icon
            sf="person.crop.circle.badge.plus"
            src={JOIN_ICON}
          />
        </Stack.Toolbar.Button>
        <Stack.Toolbar.Button
          variant="prominent"
          onPress={() => {
            router.push({
              pathname: "/contribution",
            });
          }}
        >
          <Stack.Toolbar.Icon
            sf="pencil.and.list.clipboard"
            src={RECORD_ICON}
          />
        </Stack.Toolbar.Button>
        <Stack.Toolbar.Button
          variant="prominent"
          onPress={() => {
            router.push({
              pathname: "/kosh/add",
            });
          }}
        >
          <Stack.Toolbar.Icon sf="plus" src={PLUST_ICON} />
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <KoshList />
    </View>
  );
};

export default KoshScreen;
