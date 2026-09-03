import { router } from "expo-router";
import { Text, View } from "react-native";

import { Container } from "@/components/container";

function Modal() {
  function handleClose() {
    router.back();
  }

  return (
    <Container>
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-foreground">Modal Screen</Text>
      </View>
    </Container>
  );
}

export default Modal;
