import { ChatDateSeparator } from "@/components/chat/chat-date-separator";
import { MessageRow } from "@/components/chat/message-row";
import { ThemedText } from "@/components/themed-text";
import {
  useChatThreadView,
  useMessageActionsContext,
} from "@/contexts/chat-thread-context";
import { useKeyboard } from "@/hooks/use-keyboard";
import type { ChatListEntry } from "@kosh-app/utils";
import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { ActivityIndicator, ScrollViewProps, View } from "react-native";
import Animated, { ZoomIn, ZoomOut } from "react-native-reanimated";
import { AnimatedView } from "../animated-view";
import { VirtualizedListScrollView } from "../layout/virtualized-list-scroll-view";
import { StyledSymbolView } from "../styled-symbol-view";

/**
 * Static helpers extracted outside the component to avoid recreating function references on each render.
 */
const keyExtractor = (item: ChatListEntry) => item.key;
const getItemType = (item: ChatListEntry) => item.kind;
const ItemSeparator = () => <View style={{ height: 10 }} />;
const ListHeader = () => <View style={{ height: 20 }} />;
const contentContainerStyle = { padding: 12 };

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
    listRef,
  } = useChatThreadView();
  const { openMessage } = useMessageActionsContext();
  const { isKeyboardVisible, dismissKeyboard } = useKeyboard();
  const router = useRouter();

  const onPressImage = useCallback(
    (url: string) => {
      router.push({ pathname: "/view/[image]", params: { image: url } });
    },
    [router],
  );

  const data = useMemo(() => entries.toReversed(), [entries]);
  const scrollToMessage = useCallback(
    (targetId: string) => {
      const dataIndex = data.findIndex(
        (e) => e.kind === "message" && e.message.id === targetId,
      );
      if (dataIndex !== -1) {
        listRef.current?.scrollToIndex({
          index: dataIndex,
          animated: true,
          viewPosition: 0.5,
        });
      }
    },
    [data],
  );

  const renderItem = useCallback(
    ({ item }: { item: ChatListEntry }) => {
      if (item.kind === "date") return <ChatDateSeparator entry={item} />;
      return (
        <MessageRow
          entry={item}
          myUserId={myUserId}
          onLongPress={openMessage}
          onPressImage={onPressImage}
          onPressReply={scrollToMessage}
        />
      );
    },
    [myUserId, openMessage, onPressImage, scrollToMessage],
  );

  const ListEmpty = useMemo(() => {
    if (isHistoryPending) {
      return (
        <View className="pb-32 items-center justify-center">
          <ActivityIndicator size={"large"} />
        </View>
      );
    }
    return (
      <View className="pb-32 items-center justify-center gap-3">
        <StyledSymbolView size={50} name={{ android: "sms", ios: "message" }} />
        <ThemedText className="italic text-center text-base">
          Start a conversation
        </ThemedText>
      </View>
    );
  }, [isHistoryPending]);

  const ListFooter = useMemo(
    () => (
      <View className="pt-safe-offset-20">
        {isFetchingOlder && (
          <AnimatedView
            entering={ZoomIn}
            exiting={ZoomOut}
            className="items-center justify-center"
          >
            <ActivityIndicator size="small" />
          </AnimatedView>
        )}
      </View>
    ),
    [isFetchingOlder],
  );

  const memoList = useCallback(
    (props: ScrollViewProps) => <VirtualizedListScrollView {...props} />,
    [],
  );

  return (
    <Animated.FlatList
      ref={listRef}
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListEmptyComponent={ListEmpty}
      ListHeaderComponent={ListHeader}
      ListFooterComponent={ListFooter}
      inverted
      onEndReached={loadOlder}
      ItemSeparatorComponent={ItemSeparator}
      contentContainerStyle={contentContainerStyle}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      initialNumToRender={20}
      maxToRenderPerBatch={15}
      windowSize={21}
      updateCellsBatchingPeriod={10}
      removeClippedSubviews={false}
      scrollEventThrottle={16}
      onEndReachedThreshold={0.5}
      renderScrollComponent={memoList}
    />
  );
};
