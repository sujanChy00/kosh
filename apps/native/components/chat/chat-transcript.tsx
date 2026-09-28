import { DateSeparator } from "@/components/chat/date-separator";
import { MessageRow } from "@/components/chat/message-row";
import { ThemedText } from "@/components/themed-text";
import {
  useChatThreadView,
  useMessageActionsContext,
} from "@/contexts/chat-thread-context";
import type { ChatListEntry } from "@kosh-app/utils";
import { LegendList } from "@legendapp/list/react-native";
import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { ActivityIndicator, View } from "react-native";

/**
 * The scrolling transcript.
 *
 * Reads the merged entry list rather than the raw queries, so the list component
 * never has to know that a pending bubble or an in-flight reaction patch is part
 * of what it is drawing. It also reaches the actions context for exactly one
 * thing - the id setter each row hands to `onLongPress`.
 */
export const ChatTranscript = () => {
  const {
    entries,
    myUserId,
    isHistoryPending,
    isRefetching,
    isFetchingOlder,
    loadOlder,
    refresh,
  } = useChatThreadView();
  const { openMessage } = useMessageActionsContext();
  const router = useRouter();

  // Tapping an attachment hands off to the shared full-screen viewer, which
  // already handles pinch / pan / double-tap. Long-press never reaches here:
  // React Native suppresses `onPress` once `onLongPress` has fired, so a
  // long-press opens the actions sheet instead of navigating away.
  const onPressImage = useCallback(
    (url: string) => {
      router.push({ pathname: "/view/[image]", params: { image: url } });
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: ChatListEntry }) => {
      if (item.kind === "date") return <DateSeparator entry={item} />;
      return (
        <MessageRow
          entry={item}
          myUserId={myUserId}
          onLongPress={openMessage}
          onPressImage={onPressImage}
        />
      );
    },
    [myUserId, openMessage, onPressImage],
  );

  const keyExtractor = useCallback((item: ChatListEntry) => item.key, []);
  const getItemType = useCallback((item: ChatListEntry) => item.kind, []);

  const ListEmpty = useMemo(() => {
    if (isHistoryPending) {
      return (
        <View className="py-10 items-center justify-center">
          <ActivityIndicator />
        </View>
      );
    }
    return (
      <View className="py-16 px-8 items-center justify-center">
        <ThemedText className="text-muted-foreground text-sm text-center">
          No messages yet. Say hello.
        </ThemedText>
      </View>
    );
  }, [isHistoryPending]);

  const ListFooter = useMemo(
    () =>
      isFetchingOlder ? (
        <View className="py-4 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : null,
    [isFetchingOlder],
  );

  return (
    <LegendList
      data={entries}
      recycleItems
      keyExtractor={keyExtractor}
      getItemType={getItemType}
      renderItem={renderItem}
      ListEmptyComponent={ListEmpty}
      ListFooterComponent={ListFooter}
      initialScrollAtEnd
      maintainScrollAtEnd
      maintainVisibleContentPosition={{ data: true, size: true }}
      onStartReached={loadOlder}
      onStartReachedThreshold={0.3}
      onRefresh={refresh}
      refreshing={isRefetching}
      contentContainerClassName="py-3"
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    />
  );
};
