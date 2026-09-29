import { ThemedText } from "@/components/themed-text";
import { Avatar } from "@/components/ui/avatar";
import type { ChatMessageItem } from "@kosh-app/api/routers/chat";
import { cn } from "@kosh-app/utils";
import { memo } from "react";
import { Pressable, View } from "react-native";

import type { ChatListEntry } from "@kosh-app/utils";
import { chatEntrySignature } from "@kosh-app/utils";
import { MessageRowAttachment } from "./message-row-attacthment";
import { MessageRowReactions } from "./message-row-reactions";
import { MessageRowReplyText } from "./message-row-reply-text";
import { MessageRowStatus } from "./message-row-status";
import { MessageRowText } from "./message-row-text";

type MessageEntry = Extract<ChatListEntry, { kind: "message" }>;

export type MessageRowProps = {
  entry: MessageEntry;
  myUserId: string;
  onLongPress: (messageId: string) => void;
  onPressImage: (url: string) => void;
};

function MessageRowImpl({
  entry,
  myUserId,
  onLongPress,
  onPressImage,
}: MessageRowProps) {
  const { message, showSender, delivery } = entry;
  const isMine = message.senderId === myUserId;
  const isPending = message.id.startsWith("pending:");
  const failed = delivery === "failed";
  const isDeleted = message.deletedAt != null;

  const onLongPressPressable =
    isPending || isDeleted ? undefined : () => onLongPress(message.id);

  return (
    <View
      className={cn(
        showSender ? "items-end gap-1 flex-row" : "",
        isMine ? "justify-end" : "justify-start",
        failed && "opacity-60",
      )}
    >
      {!isMine && showSender && (
        <Avatar className="size-8 bg-muted">
          <Avatar.Image
            source={message.sender.image}
            accessibilityLabel={message.sender.name}
            alt={message.sender.name}
          />
          <Avatar.Fallback
            source={message.sender.image}
            className={"text-background"}
            fallback={message.sender.name}
          />
        </Avatar>
      )}

      <View className="flex-1">
        <Pressable
          className="flex-1"
          onLongPress={
            isPending || isDeleted ? undefined : () => onLongPress(message.id)
          }
          delayLongPress={280}
          onPress={failed ? () => onLongPress(message.id) : undefined}
          disabled={isPending && !failed}
          accessibilityRole="button"
          accessibilityLabel={
            failed ? "Message failed to send. Activate to retry." : undefined
          }
        >
          <View
            className={cn(
              "max-w-[80%]",
              isMine ? "ml-auto items-end" : "mr-auto items-start",
            )}
          >
            {/*{showSender && (
              <ThemedText className="text-[11px] font-notosans-semibold px-1 mb-0.5">
                {message.sender.name}
              </ThemedText>
            )}*/}

            <MessageRowReplyText
              reply={message.replyTo}
              isMine={isMine}
              isDeleted={isDeleted}
            />
            <View
              style={{
                opacity: failed ? 0.6 : 1,
              }}
            >
              {message.attachments &&
                message.attachments?.map((attachment) => (
                  <MessageRowAttachment
                    key={attachment.url}
                    attachment={attachment}
                    isMine={isMine}
                    onPress={onPressImage}
                    onLongPress={onLongPressPressable}
                  />
                ))}

              <MessageRowText
                deletedAt={message.deletedAt}
                content={message.content}
                isMine={isMine}
                isPending={isPending}
              />
            </View>
            <MessageRowReactions
              reactions={message.reactions}
              isMine={isMine}
            />
          </View>
        </Pressable>
        <MessageRowStatus
          isMine={isMine}
          message={message}
          delivery={delivery}
          failed={failed}
          isDeleted={isDeleted}
        />
      </View>
    </View>
  );
}

export const MessageRow = memo(MessageRowImpl, (prev, next) => {
  if (prev.myUserId !== next.myUserId) return false;
  return chatEntrySignature(prev.entry) === chatEntrySignature(next.entry);
});

function ReplyQuote({
  replyTo,
  isMine,
}: {
  replyTo: NonNullable<ChatMessageItem["replyTo"]>;
  isMine: boolean;
}) {
  return (
    <View
      className={cn(
        "rounded-lg border-l-2 border-primary px-2 py-1 mb-1 min-w-28",
        isMine ? "bg-primary-foreground/15" : "bg-surface-tertiary",
      )}
    >
      <ThemedText className="text-primary text-[11px] font-notosans-semibold">
        {replyTo.senderName}
      </ThemedText>
      <ThemedText
        numberOfLines={1}
        className={cn(
          "text-[11px]",
          isMine ? "text-primary-foreground/80" : "text-muted-foreground",
        )}
      >
        {replyTo.deletedAt
          ? "Deleted message"
          : (replyTo.content ?? "Sent a photo")}
      </ThemedText>
    </View>
  );
}
