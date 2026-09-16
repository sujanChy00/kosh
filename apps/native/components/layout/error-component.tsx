import { View } from "react-native";
import { ThemedText } from "../themed-text";
import { PrimaryButton } from "../ui/button";

interface Props {
  refetch: () => void;
  message?: string;
}

export const ErrorComponent = ({ refetch, message }: Props) => {
  return (
    <View className="flex-1 items-center justify-center gap-4 p-6">
      <ThemedText className="text-muted">
        {message ?? "Something went wrong."}
      </ThemedText>
      <PrimaryButton onPress={() => refetch()}>
        <PrimaryButton.Label>Try again</PrimaryButton.Label>
      </PrimaryButton>
    </View>
  );
};
