import PLUST_ICON from "@expo/material-symbols/add.xml";
import { Stack, useRouter } from "expo-router";
import { Text, View } from "react-native";

const KoshScreen = () => {
  const router = useRouter();
  return (
    <View className="flex-1">
      <Stack.Title>My Kosh</Stack.Title>
      <Stack.Toolbar placement="right">
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
      <Text>KoshScreen</Text>
    </View>
  );
};

export default KoshScreen;
