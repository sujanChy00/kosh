import { ChatMessageItem } from "@kosh-app/api/routers/chat";
import { cn } from "@kosh-app/utils";
import { Pressable } from "react-native";
import { StyledImage } from "../styled-image";
import { ThemedText } from "../themed-text";

interface Props {
  isMine: boolean;
  reply: ChatMessageItem["replyTo"];
  isDeleted: boolean;
  onPressReply?: (messageId: string) => void;
  showSender: boolean;
}

export const MessageRowReplyText = ({
  isMine,
  reply,
  isDeleted,
  onPressReply,
  showSender,
}: Props) => {
  if (isDeleted || !reply) return null;

  const handlePress = () => {
    if (reply.id && onPressReply) {
      onPressReply(reply.id);
    }
  };

  const photoUrl = !reply.deletedAt ? reply.attachments?.[0]?.url : null;
  const displayText = reply.deletedAt
    ? "Deleted message"
    : (reply.content ?? (photoUrl ? "Photo" : "Sent a photo"));

  if (!!photoUrl)
    return (
      <Pressable onPress={handlePress}>
        <StyledImage
          source={{ uri: photoUrl }}
          alt={displayText ?? "chat photo"}
          contentFit="cover"
          className="size-20 rounded-lg opacity-50 translate-y-2"
        />
      </Pressable>
    );

  return (
    <Pressable
      onPress={handlePress}
      className={cn(
        "px-3 pt-3 translate-y-2 pb-3 rounded-3xl bg-gray-300 dark:bg-zinc-900 gap-y-1 active:opacity-70",
      )}
    >
      <ThemedText
        selectable={false}
        numberOfLines={2}
        className="text-[11px] dark:text-muted text-foreground"
        ellipsizeMode="tail"
      >
        {displayText}
      </ThemedText>
      <ThemedText
        className={cn(
          "text-[10px] text-primary font-notosans-semibold mb-0.5",
          isMine ? "text-right" : "text-left",
        )}
      >
        {reply.senderName}
      </ThemedText>
    </Pressable>
  );
};
