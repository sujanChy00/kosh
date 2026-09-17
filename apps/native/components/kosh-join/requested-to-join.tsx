import { useRouter } from "expo-router";
import { View } from "react-native";
import { PrimaryButton } from "../ui/button";
import { Card } from "../ui/card";

export const RequestedToJoin = () => {
  const router = useRouter();
  return (
    <View className="p-4 flex-1 justify-center gap-y-6">
      <Card className={"gap-y-6"}>
        <Card.Header className="gap-y-1">
          <Card.Title className="text-2xl text-center font-notosans-semibold">
            Request sent
          </Card.Title>
          <Card.Description className="text-muted text-sm text-center">
            Your join request is now waiting for the Adhyaksh to approve it.
            You'll be notified once they review it.
          </Card.Description>
        </Card.Header>
        <Card.Footer>
          <PrimaryButton
            onPress={() => {
              router.replace({
                pathname: "/kosh",
              });
            }}
          >
            <PrimaryButton.Label>Go Back</PrimaryButton.Label>
          </PrimaryButton>
        </Card.Footer>
      </Card>
    </View>
  );
};
