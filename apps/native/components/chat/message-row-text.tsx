import { cn } from "@kosh-app/utils";
import { View } from "react-native";
import { ThemedText } from "../themed-text";

interface Props {
  deletedAt: string | null;
  content: string | null;
  isMine: boolean;
  isPending: boolean;
}

export const MessageRowText = ({
  deletedAt,
  content,
  isMine,
  isPending,
}: Props) => {
  if (deletedAt)
    return (
      <View
        className={cn(
          "px-4 py-2 rounded-3xl bg-surface-secondary/60",
          isMine ? "rounded-br-none" : "rounded-bl-none",
        )}
      >
        <ThemedText
          className={"text-xs font-notosans-italic text-muted-foreground"}
        >
          This message was deleted
        </ThemedText>
      </View>
    );
  if (content)
    return (
      <View
        className={cn(
          "px-4 py-2 rounded-3xl",
          isMine
            ? "rounded-br-none bg-primary"
            : "rounded-bl-none  bg-surface-secondary",
        )}
      >
        <ThemedText
          selectable={!isPending}
          className={cn(
            "text-sm leading-5",
            isMine ? "text-primary-foreground" : "text-foreground",
          )}
        >
          {content}
        </ThemedText>
      </View>
    );
  return null;
};
