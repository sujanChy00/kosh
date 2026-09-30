import { Avatar } from "@/components/ui/avatar";
import type { ChatThreadListItem } from "@kosh-app/api/routers/chat";
import { cn, formatThreadStamp } from "@kosh-app/utils";
import { Link } from "expo-router";
import { memo } from "react";
import { TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";

export type ChatThreadRowProps = {
  thread: ChatThreadListItem;
};

function ChatThreadRowImpl({ thread }: ChatThreadRowProps) {
  const unread = thread.unreadCount > 0;
  const isGroup = thread.type === "group";
  const preview =
    isGroup && thread.lastMessageSenderName
      ? `${thread.lastMessageSenderName.split(" ")[0]}: ${thread.lastMessagePreview ?? ""}`
      : (thread.lastMessagePreview ?? "No messages yet");

  return (
    <Link
      asChild
      href={{
        pathname: "/chat/[threadId]",
        params: { threadId: thread.id },
      }}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        accessibilityRole="link"
        accessibilityLabel={`${thread.title}${unread ? `, ${thread.unreadCount} unread` : ""}`}
      >
        <View className="w-full flex-row items-center gap-3 px-4 py-3 overflow-hidden">
          <Avatar className="size-12 shrink-0">
            <Avatar.Image
              source={thread.avatarUrl}
              accessibilityLabel={thread.title}
            />
            <Avatar.Fallback
              source={thread.avatarUrl}
              fallback={thread.title}
            />
          </Avatar>

          <View className="flex-1 min-w-0">
            <ThemedText
              selectable={false}
              numberOfLines={1}
              ellipsizeMode="tail"
              className={cn(
                "text-[15px]",
                unread ? "font-notosans-semibold" : "font-notosans-medium",
              )}
            >
              {thread.title}
            </ThemedText>

            <ThemedText
              selectable={false}
              numberOfLines={1}
              ellipsizeMode="tail"
              className={cn(
                "text-[13px]",
                unread ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {preview}
            </ThemedText>

            {isGroup && thread.subtitle && (
              <ThemedText
                selectable={false}
                numberOfLines={1}
                ellipsizeMode="tail"
                className="text-muted-foreground text-[11px]"
              >
                {thread.subtitle}
              </ThemedText>
            )}
          </View>

          <View className="shrink-0 items-end gap-1">
            <ThemedText
              selectable={false}
              numberOfLines={1}
              className={cn(
                "text-[11px]",
                unread
                  ? "text-primary font-notosans-semibold"
                  : "text-muted-foreground",
              )}
            >
              {formatThreadStamp(thread.lastMessageAt)}
            </ThemedText>

            {unread && (
              <View className="min-w-5 h-5 px-1.5 rounded-full bg-primary items-center justify-center">
                <ThemedText
                  selectable={false}
                  className="text-primary-foreground text-[10px] font-notosans-semibold"
                >
                  {thread.unreadCount > 99 ? "99+" : thread.unreadCount}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
}

export const ChatThreadRow = memo(
  ChatThreadRowImpl,
  (prev, next) =>
    prev.thread.id === next.thread.id &&
    prev.thread.type === next.thread.type &&
    prev.thread.title === next.thread.title &&
    prev.thread.subtitle === next.thread.subtitle &&
    prev.thread.avatarUrl === next.thread.avatarUrl &&
    prev.thread.unreadCount === next.thread.unreadCount &&
    prev.thread.lastMessageAt === next.thread.lastMessageAt &&
    prev.thread.lastMessagePreview === next.thread.lastMessagePreview &&
    prev.thread.lastMessageSenderName === next.thread.lastMessageSenderName,
);
