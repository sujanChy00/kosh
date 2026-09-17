import { useRouter } from "expo-router";
import { memo, useState } from "react";
import { View } from "react-native";
import { ThemedText } from "../themed-text";
import { OutlineButton, PrimaryButton } from "../ui/button";
import { KoshJoinDialog } from "./kosh-join-dialog";

export const KoshEmptyComponent = memo(() => {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  return (
    <>
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
      <View className="flex-1 items-center justify-center gap-4 p-6">
        <View className="gap-y-0.5">
          <ThemedText className="text-center text-muted text-base">
            You are not part of any kosh yet.
          </ThemedText>
          <ThemedText className="text-center text-muted text-base">
            Create one to get started.
          </ThemedText>
        </View>
        <PrimaryButton
          className="w-[50%]"
          onPress={() => router.push({ pathname: "/kosh/add" })}
        >
          <PrimaryButton.Label className="text-center w-full">
            Create a kosh
          </PrimaryButton.Label>
        </PrimaryButton>
        <OutlineButton
          className="w-[50%]"
          onPress={() => {
            setIsVisible(true);
          }}
        >
          <OutlineButton.Label className="text-center w-full">
            Join a kosh
          </OutlineButton.Label>
        </OutlineButton>
      </View>
    </>
  );
});
