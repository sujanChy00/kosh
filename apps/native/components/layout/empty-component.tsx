import { cn } from "@kosh-app/utils";
import { useRouter } from "expo-router";
import { View } from "react-native";
import { StyledSymbolView } from "../styled-symbol-view";
import { ThemedText } from "../themed-text";
import { PrimaryButton } from "../ui/button";

interface Props {
  message: string;
  description?: string;
  className?: string;
  showActionButton?: boolean;
  actionButtonContent?: React.ReactNode;
  actionButtonOnPress?: () => void;
}

export const EmptyComponent = ({
  message,
  description,
  className,
  showActionButton = true,
  actionButtonContent,
  actionButtonOnPress,
}: Props) => {
  const router = useRouter();
  return (
    <View
      className={cn("flex-1 items-center justify-center gap-y-6", className)}
    >
      <View className="gap-y-1">
        <ThemedText className="text-lg font-notosans-semibold text-center">
          {message}
        </ThemedText>
        <ThemedText className="text-center text-muted-foreground">
          {description ?? "Please check back later"}
        </ThemedText>
      </View>
      {showActionButton && (
        <PrimaryButton
          className="px-6 gap-1"
          onPress={actionButtonOnPress ?? (() => router.back())}
        >
          {actionButtonContent ?? (
            <>
              <StyledSymbolView
                tintColorClassName="accent-primary-foreground"
                size={20}
                name={{
                  android: "arrow_left_alt",
                  ios: "arrow.left",
                }}
              />
              <PrimaryButton.Label>Go back</PrimaryButton.Label>
            </>
          )}
        </PrimaryButton>
      )}
    </View>
  );
};
