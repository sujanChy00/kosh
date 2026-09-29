import { DateSeparator } from "@/components/chat/date-separator";
import { MessageRow } from "@/components/chat/message-row";
import { ThemedText } from "@/components/themed-text";
import {
  useChatThreadView,
  useMessageActionsContext,
} from "@/contexts/chat-thread-context";
import type { ChatListEntry } from "@kosh-app/utils";
import { KeyboardAwareLegendList } from "@legendapp/list/keyboard";
import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { ActivityIndicator, View } from "react-native";

/**
 * Static helpers extracted outside the component to avoid recreating function references on each render.
 */
const keyExtractor = (item: ChatListEntry) => item.key;
const getItemType = (item: ChatListEntry) => item.kind;
const ItemSeparator = () => <View style={{ height: 10 }} />;
const ListFooter = () => <View style={{ height: 20 }} />;

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

  const ListHeader = useMemo(
    () =>
      isFetchingOlder ? (
        <View className="py-4 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : null,
    [isFetchingOlder],
  );

  return (
    <KeyboardAwareLegendList
      data={entries}
      recycleItems
      drawDistance={1500}
      estimatedItemSize={70}
      keyExtractor={keyExtractor}
      getItemType={getItemType}
      renderItem={renderItem}
      ListEmptyComponent={ListEmpty}
      ListHeaderComponent={ListHeader}
      ListFooterComponent={ListFooter}
      initialScrollAtEnd
      maintainScrollAtEnd
      maintainVisibleContentPosition={{ size: true }}
      onStartReached={loadOlder}
      ItemSeparatorComponent={ItemSeparator}
      onStartReachedThreshold={0.3}
      onRefresh={refresh}
      refreshing={isRefetching}
      contentContainerClassName="p-3"
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    />
  );
};

