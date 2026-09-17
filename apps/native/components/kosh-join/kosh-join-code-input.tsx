import { ThemedText } from "@/components/themed-text";
import { PrimaryButton } from "@/components/ui/button";
import { TextInput } from "@/components/ui/text-input";
import { View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";

export const KoshJoinCodeInput = () => {
  return (
    <>
      <View className="px-4 pt-20 gap-y-10">
        <View className="gap-y-1">
          <ThemedText className="text-xl font-notosans-semibold capitalize">
            Enter invitation code
          </ThemedText>
          <ThemedText className="text-muted-foreground">
            Paste the invite code you got from the Adhyaksh of the kosh.
          </ThemedText>
        </View>
        <TextInput placeholder="e.g. NEWK-XXXXXX" label="Invite code" />
      </View>
      <KeyboardStickyView
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 12,
        }}
        offset={{
          closed: -20,
          opened: -10,
        }}
      >
        <PrimaryButton>
          <PrimaryButton.Label>Join</PrimaryButton.Label>
        </PrimaryButton>
      </KeyboardStickyView>
    </>
  );
};
