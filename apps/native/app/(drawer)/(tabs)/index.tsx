import { Text, View } from "react-native";

import { Container } from "@/components/container";

export default function Home() {
  return (
    <Container className="p-6">
      <View className="flex-1 justify-center items-center">
        <Text className="text-3xl mb-2 text-foreground">Tab One</Text>
      </View>
    </Container>
  );
}
