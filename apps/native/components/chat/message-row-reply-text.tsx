import { ChatMessageItem } from "@kosh-app/api/routers/chat";
import { cn } from "@kosh-app/utils";
import { View } from "react-native";
import { ThemedText } from "../themed-text";

interface Props {
  isMine: boolean;
  reply: ChatMessageItem["replyTo"];
  isDeleted: boolean;
}

export const MessageRowReplyText = ({ isMine, reply, isDeleted }: Props) => {
  if (isDeleted || !reply) return null;
  return (
    <View
      className={cn(
        "px-3 pt-3 translate-y-2 pb-3 rounded-3xl bg-gray-300 dark:bg-zinc-900 gap-y-1",
      )}
    >
      <ThemedText
        numberOfLines={2}
        className="text-[11px] dark:text-muted text-foreground"
        ellipsizeMode="tail"
      >
        {reply.deletedAt
          ? "Deleted message"
          : (reply.content ?? "Sent a photo")}
      </ThemedText>
      <ThemedText
        className={cn(
          "text-[10px] text-primary font-notosans-semibold",
          isMine ? "text-right" : "text-left",
        )}
      >
        {reply.senderName}
      </ThemedText>
    </View>
  );
};
