import { StyledImage } from "@/components/styled-image";
import { ThemedText } from "@/components/themed-text";
import { Avatar } from "@/components/ui/avatar";
import type { ChatMessageItem } from "@kosh-app/api/routers/chat";
import { cn } from "@kosh-app/utils";
import { memo } from "react";
import { Pressable, View } from "react-native";

import type { ChatListEntry } from "@kosh-app/utils";
import {
  chatEntrySignature,
  formatBytes,
  formatMessageTime,
} from "@kosh-app/utils";

type MessageEntry = Extract<ChatListEntry, { kind: "message" }>;

export type MessageRowProps = {
  entry: MessageEntry;
  myUserId: string;
  onLongPress: (messageId: string) => void;
  onPressImage: (url: string) => void;
};

/**
 * One transcript row.
 *
 * Everything rendered here arrives on the entry itself - including whether to
 * show the sender line - because with `recycleItems` a row is handed a
 * different item without remounting, so it cannot ask its neighbours anything.
 * That is what makes recycling safe on this list.
 */
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

  /**
   * Long-press for the attachment's own pressable. The image renders inside its
   * own `Pressable` to make it tappable, and an inner pressable claims the
   * touch - so without forwarding here the row's `onLongPress` never fires for
   * images and long-pressing one did nothing at all.
   */
  const onLongPressPressable =
    isPending || message.deletedAt ? undefined : () => onLongPress(message.id);

  const bubble = (
    <View className={cn("max-w-[80%]", isMine ? "items-end" : "items-start")}>
      {showSender && (
        <ThemedText className="text-primary text-[11px] font-notosans-semibold px-1 mb-0.5">
          {message.sender.name}
        </ThemedText>
      )}

      {message.replyTo && (
        <ReplyQuote replyTo={message.replyTo} isMine={isMine} />
      )}

      <View
        className={cn(
          "px-3 py-2 rounded-2xl gap-1",
          isMine
            ? "bg-primary rounded-br-md"
            : "bg-surface-secondary rounded-bl-md",
          failed && "opacity-60",
        )}
      >
        {message.attachments?.map((attachment) => (
          <Attachment
            key={attachment.url}
            attachment={attachment}
            isMine={isMine}
            onPress={onPressImage}
            onLongPress={onLongPressPressable}
          />
        ))}

        {message.deletedAt ? (
          <ThemedText
            className={cn(
              "text-sm italic",
              isMine ? "text-primary-foreground/70" : "text-muted-foreground",
            )}
          >
            This message was deleted
          </ThemedText>
        ) : message.content ? (
          <ThemedText
            selectable={!isPending}
            className={cn(
              "text-sm leading-5",
              isMine ? "text-primary-foreground" : "text-foreground",
            )}
          >
            {message.content}
          </ThemedText>
        ) : null}
      </View>

      {/* A deleted message is a tombstone: it keeps its slot in the transcript
          but gives up every piece of content, reactions included. */}
      {!message.deletedAt && message.reactions.length > 0 && (
        <View className="flex-row flex-wrap gap-1 mt-1">
          {message.reactions.map((reaction) => (
            <ReactionChip
              key={reaction.emoji}
              emoji={reaction.emoji}
              count={reaction.userIds.length}
              mine={reaction.userIds.includes(myUserId)}
            />
          ))}
        </View>
      )}

      <View
        className={cn(
          "flex-row items-center gap-1 mt-0.5",
          isMine ? "justify-end" : "justify-start",
        )}
      >
        <ThemedText className="text-muted-foreground text-[10px]">
          {formatMessageTime(message.createdAt)}
        </ThemedText>
        {message.editedAt && !message.deletedAt && (
          <ThemedText className="text-muted-foreground text-[10px] italic">
            edited
          </ThemedText>
        )}
        {delivery === "uploading" && (
          <ThemedText className="text-muted-foreground text-[10px]">
            Uploading…
          </ThemedText>
        )}
        {delivery === "sending" && (
          <ThemedText className="text-muted-foreground text-[10px]">
            Sending…
          </ThemedText>
        )}
        {failed && (
          <ThemedText className="text-danger text-[10px] font-notosans-semibold">
            Not sent · tap to retry
          </ThemedText>
        )}
      </View>
    </View>
  );

  return (
    <View
      className={cn(
        "flex-row px-3",
        showSender ? "mt-3" : "mt-0.5",
        isMine ? "justify-end" : "justify-start",
        failed && "opacity-60",
      )}
    >
      {!isMine && (
        <View className="w-8">
          {showSender && (
            <Avatar className="size-8">
              {message.sender.image ? (
                <Avatar.Image
                  source={{ uri: message.sender.image }}
                  accessibilityLabel={message.sender.name}
                />
              ) : (
                <Avatar.Fallback
                  source={message.sender.image}
                  fallback={message.sender.name}
                />
              )}
            </Avatar>
          )}
        </View>
      )}

      <Pressable
        // A soft-deleted message is a tombstone: there is nothing left to
        // react to, edit or delete, and the server rejects all three. Leaving
        // it long-pressable produced a menu whose every option failed.
        onLongPress={
          isPending || message.deletedAt
            ? undefined
            : () => onLongPress(message.id)
        }
        delayLongPress={280}
        onPress={failed ? () => onLongPress(message.id) : undefined}
        disabled={isPending && !failed}
        accessibilityRole="button"
        accessibilityLabel={
          failed ? "Message failed to send. Activate to retry." : undefined
        }
      >
        {bubble}
      </Pressable>
    </View>
  );
}

/**
 * Compared on the entry's full render signature rather than its key. `recent`
 * is refetched every few seconds and each response is a fresh set of objects,
 * so a key-only comparison would let a new message arriving in the tail
 * invalidate every mounted row.
 */
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

function Attachment({
  attachment,
  isMine,
  onPress,
  onLongPress,
}: {
  attachment: NonNullable<ChatMessageItem["attachments"]>[number];
  isMine: boolean;
  onPress: (url: string) => void;
  onLongPress?: () => void;
}) {
  const isImage =
    !attachment.mimeType || attachment.mimeType.startsWith("image/");

  if (isImage) {
    return (
      <Pressable
        onPress={() => onPress(attachment.url)}
        onLongPress={onLongPress}
        delayLongPress={280}
        accessibilityRole="imagebutton"
        accessibilityLabel={attachment.name ?? "Photo attachment"}
        accessibilityHint="Tap to view full screen, long press for actions"
      >
        <StyledImage
          source={{ uri: attachment.url }}
          className="size-56 rounded-xl"
          contentFit="cover"
          transition={150}
        />
      </Pressable>
    );
  }

  const size = formatBytes(attachment.size);

  return (
    <View
      className={cn(
        "flex-row items-center gap-2 rounded-xl px-2 py-1.5 min-w-48",
        isMine ? "bg-primary-foreground/15" : "bg-surface-tertiary",
      )}
    >
      <View className="size-8 rounded-lg bg-primary/20 items-center justify-center">
        <ThemedText className="text-primary text-[9px] font-notosans-semibold">
          {(attachment.name?.split(".").pop() ?? "FILE")
            .slice(0, 4)
            .toUpperCase()}
        </ThemedText>
      </View>
      <View className="flex-1">
        <ThemedText numberOfLines={1} className="text-xs">
          {attachment.name ?? "Attachment"}
        </ThemedText>
        {size && (
          <ThemedText
            className={cn(
              "text-[10px]",
              isMine ? "text-primary-foreground/70" : "text-muted-foreground",
            )}
          >
            {size}
          </ThemedText>
        )}
      </View>
    </View>
  );
}

function ReactionChip({
  emoji,
  count,
  mine,
}: {
  emoji: string;
  count: number;
  mine: boolean;
}) {
  return (
    <View
      className={cn(
        "flex-row items-center gap-0.5 self-start px-1.5 py-0.5 rounded-full border",
        mine ? "border-primary bg-primary-soft" : "border-border bg-surface",
      )}
    >
      <ThemedText className="text-xs">{emoji}</ThemedText>
      {count > 1 && (
        <ThemedText className="text-muted-foreground text-[10px]">
          {count}
        </ThemedText>
      )}
    </View>
  );
}
