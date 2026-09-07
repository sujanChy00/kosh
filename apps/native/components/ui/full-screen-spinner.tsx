import { cn } from "@kosh-app/utils";
import { ActivityIndicator, Modal, View } from "react-native";
import { ThemedText } from "../themed-text";

interface Props {
  isVisible: boolean;
  loadingText?: React.ReactNode;
  className?: string;
}

export const FullScreenSpinner = ({
  isVisible,
  loadingText = "Please wait...",
  className,
}: Props) => {
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        // Intentionally do nothing.
        // Prevents Android back button from dismissing the modal.
      }}
    >
      <View className="flex-1 items-center justify-center bg-black/50">
        <View
          className={cn(
            "items-center rounded-lg bg-background px-6 py-5 gap-y-3",
            className,
          )}
        >
          <ActivityIndicator size="large" />
          {typeof loadingText === "string" ? (
            <ThemedText>{loadingText}</ThemedText>
          ) : (
            loadingText
          )}
        </View>
      </View>
    </Modal>
  );
};
