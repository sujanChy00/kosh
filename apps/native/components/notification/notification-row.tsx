import { Avatar } from "@/components/ui/avatar";
import type { NotificationFeedItem } from "@kosh-app/api/routers/notification";
import { formatThreadStamp } from "@kosh-app/utils";
import { memo } from "react";
import { TouchableOpacity, View } from "react-native";

import { ThemedText } from "../themed-text";

export type NotificationRowProps = {
  item: NotificationFeedItem;
  /**
   * One shared handler for every row, rather than a closure built per item:
   * a new function per row would defeat the `memo` below and hand every
   * mounted row fresh props on each parent render.
   */
  onPress: (threadId: string) => void;
};

function NotificationRowImpl({ item, onPress }: NotificationRowProps) {
  const unread = item.unreadCount > 0;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}${unread ? `, ${item.unreadCount} unread` : ""}`}
      onPress={() => onPress(item.threadId)}
    >
      <View className="w-full flex-row items-center gap-3 px-4 py-3">
        <Avatar className="size-12 shrink-0">
          <Avatar.Fallback source={null} fallback={item.title} />
        </Avatar>

        <View className="flex-1 gap-0.5">
          <View className="flex-row items-baseline gap-2">
            <ThemedText
              numberOfLines={1}
              className={`flex-1 text-base ${
                unread ? "font-notosans-semibold" : "font-notosans"
              }`}
              selectable={false}
            >
              {item.title}
            </ThemedText>
            <ThemedText
              className="text-xs text-muted"
              selectable={false}
              numberOfLines={1}
            >
              {formatThreadStamp(new Date(item.lastActivityMs).toISOString())}
            </ThemedText>
          </View>

          <View className="flex-row items-center gap-2">
            <ThemedText
              numberOfLines={1}
              className={`flex-1 text-sm ${unread ? "text-foreground" : "text-muted"}`}
              selectable={false}
            >
              {item.body}
            </ThemedText>

            {unread ? (
              <View className="min-w-5 h-5 px-1.5 shrink-0 rounded-full bg-primary items-center justify-center">
                <ThemedText
                  selectable={false}
                  className="text-primary-foreground text-[10px] font-notosans-semibold"
                >
                  {item.unreadCount > 99 ? "99+" : item.unreadCount}
                </ThemedText>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/**
 * Field-level comparison rather than a shallow prop compare.
 *
 * The feed polls every few seconds, so without this every mounted row re-renders
 * on every poll even though almost none of them changed. `onPress` is excluded
 * on purpose: it is a stable callback by construction, and comparing it would
 * only hide a real bug in whoever passes it down.
 */
export const NotificationRow = memo(
  NotificationRowImpl,
  (prev, next) =>
    prev.item.id === next.item.id &&
    prev.item.threadId === next.item.threadId &&
    prev.item.title === next.item.title &&
    prev.item.body === next.item.body &&
    prev.item.lastActivityMs === next.item.lastActivityMs &&
    prev.item.unreadCount === next.item.unreadCount,
);
