import { cn, formatMessageTime } from "@kosh-app/utils";
import { View } from "react-native";
import { ThemedText } from "../themed-text";

interface Props {
  isMine: boolean;
  message: {
    createdAt: string;
    editedAt: string | null;
  };
  isSending: boolean;
  failed: boolean;
  isDeleted: boolean;
}

export const MessageRowStatus = ({
  isMine,
  message,
  isSending = false,
  failed,
  isDeleted,
}: Props) => {
  return (
    <View
      className={cn(
        "flex-row items-center gap-1 mt-0.5",
        isMine ? "justify-end" : "justify-start",
      )}
    >
      {!isSending && (
        <ThemedText className="text-muted-foreground text-[10px] font-mono-medium-italic">
          {formatMessageTime(message.createdAt)}
        </ThemedText>
      )}

      {isSending && (
        <ThemedText className="text-muted-foreground text-[10px] font-notosans-italic">
          Sending…
        </ThemedText>
      )}
      {failed && !isSending && (
        <ThemedText className="text-danger text-[10px] font-notosans-semibold">
          Failed · tap to retry
        </ThemedText>
      )}
    </View>
  );
};
