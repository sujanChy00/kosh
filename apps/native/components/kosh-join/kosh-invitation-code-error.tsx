import { KoshJoinDialog } from "@/components/kosh/kosh-join-dialog";
import { OutlineButton, PrimaryButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { View } from "react-native";

interface KoshInvitationCodeErrorProps {
  onConfirm: (token: string) => void;
  onRetry: () => void;
  message: string;
}

export const KoshInvitationCodeError = ({
  onConfirm,
  onRetry,
  message,
}: KoshInvitationCodeErrorProps) => {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <>
      <KoshJoinDialog
        isVisible={isVisible}
        setIsVisible={setIsVisible}
        onConfirm={onConfirm}
      />
      <View className="p-4 flex-1 justify-center gap-y-6">
        <Card className={"gap-y-6"}>
          <Card.Header className="gap-y-1">
            <Card.Title className="text-2xl text-center font-notosans-semibold">
              Could not load invite
            </Card.Title>
            <Card.Description className="text-muted text-sm text-center">
              {message}
            </Card.Description>
          </Card.Header>
          <Card.Footer className={"gap-y-2"}>
            <PrimaryButton onPress={onRetry}>
              <PrimaryButton.Label>Try again</PrimaryButton.Label>
            </PrimaryButton>
            <OutlineButton
              onPress={() => {
                setIsVisible(true);
              }}
            >
              <OutlineButton.Label>Try another code</OutlineButton.Label>
            </OutlineButton>
          </Card.Footer>
        </Card>
      </View>
    </>
  );
};
