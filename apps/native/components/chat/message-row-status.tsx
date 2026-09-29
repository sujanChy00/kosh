import { cn, formatMessageTime } from "@kosh-app/utils";
import { View } from "react-native";
import { ThemedText } from "../themed-text";

interface Props {
  isMine: boolean;
  message: {
    createdAt: string;
    editedAt: string | null;
  };
  delivery: "uploading" | "sending" | "failed" | "sent" | undefined;
  failed: boolean;
  isDeleted: boolean;
}

export const MessageRowStatus = ({
  isMine,
  message,
  delivery,
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
      <ThemedText className="text-muted-foreground text-[10px] font-mono-medium-italic">
        {formatMessageTime(message.createdAt)}
      </ThemedText>
      {message.editedAt && !isDeleted && (
        <ThemedText className="text-muted-foreground text-[10px] font-notosans-italic">
          edited
        </ThemedText>
      )}
      {delivery === "uploading" && (
        <ThemedText className="text-muted-foreground font-notosans-italic text-[10px]">
          Uploading…
        </ThemedText>
      )}
      {delivery === "sending" && (
        <ThemedText className="text-muted-foreground text-[10px] font-notosans-italic">
          Sending…
        </ThemedText>
      )}
      {failed && (
        <ThemedText className="text-danger text-[10px] font-notosans-semibold">
          Failed · tap to retry
        </ThemedText>
      )}
    </View>
  );
};
