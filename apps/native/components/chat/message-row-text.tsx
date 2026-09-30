import { cn } from "@kosh-app/utils";
import { View } from "react-native";
import { ThemedText } from "../themed-text";

interface Props {
  deletedAt: string | null;
  editedAt?: string | null;
  content: string | null;
  isMine: boolean;
  isPending: boolean;
}

export const MessageRowText = ({
  deletedAt,
  editedAt,
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
          {editedAt ? (
            <ThemedText
              className={cn(
                "text-[10px] font-notosans-italic opacity-70 ml-1",
                isMine ? "text-primary-foreground/75" : "text-muted-foreground",
              )}
            >
              {" (edited)"}
            </ThemedText>
          ) : null}
        </ThemedText>
      </View>
    );
  return null;
};
