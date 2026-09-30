import { ChatDateSeparator } from "@/components/chat/chat-date-separator";
import { MessageRow } from "@/components/chat/message-row";
import { ThemedText } from "@/components/themed-text";
import {
  useChatThreadView,
  useMessageActionsContext,
} from "@/contexts/chat-thread-context";
import { errorToast } from "@/utils/toast";
import type { ChatListEntry } from "@kosh-app/utils";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollViewProps,
  View,
} from "react-native";
import { ZoomIn, ZoomOut } from "react-native-reanimated";
import { AnimatedView } from "../animated-view";
import { VirtualizedListScrollView } from "../layout/virtualized-list-scroll-view";
import { StyledSymbolView } from "../styled-symbol-view";

/**
 * How many older pages a reply jump will pull in before giving up.
 *
 * Bounded on purpose: a jump to a message near the top of a long thread should
 * not quietly download the entire history, and six pages is far more than any
 * visible viewport needs.
 */
const MAX_JUMP_PAGES = 6;

/**
 * Settle time before retrying a scroll whose target had not been measured yet.
 *
 * Long enough for the row to have been laid out once, short enough that the
 * second scroll reads as one continuous movement rather than a stall.
 */
const SCROLL_RETRY_MS = 350;

/**
 * Static helpers extracted outside the component to avoid recreating function references on each render.
 */
const keyExtractor = (item: ChatListEntry) => item.key;
// const getItemType = (item: ChatListEntry) => item.kind;
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
    loadOlderOnce,
    hasOlder,
    refresh,
    listRef,
  } = useChatThreadView();
  const { openMessage } = useMessageActionsContext();
  const router = useRouter();

  const onPressImage = useCallback(
    (url: string) => {
      router.push({ pathname: "/view/[image]", params: { image: url } });
    },
    [router],
  );

  const data = useMemo(() => entries.toReversed(), [entries]);

  const findMessageIndex = useCallback(
    (targetId: string) =>
      data.findIndex((e) => e.kind === "message" && e.message.id === targetId),
    [data],
  );

  const scrollToIndex = useCallback(
    (index: number) => {
      listRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
    },
    [listRef],
  );

  /**
   * A jump waiting for its target to be paged in, or for the row to be
   * measured. Held in a ref rather than state because it is a command in
   * flight, not something to render.
   */
  const pendingJump = useRef<{ id: string; pages: number } | null>(null);

  const scrollToMessage = useCallback(
    (targetId: string) => {
      const index = findMessageIndex(targetId);
      if (index !== -1) {
        scrollToIndex(index);
        return;
      }
      // Not loaded yet. Arm the jump and pull in one more page; the effect
      // below takes it from there.
      pendingJump.current = { id: targetId, pages: 0 };
      loadOlderOnce();
    },
    [findMessageIndex, scrollToIndex, loadOlderOnce],
  );

  /**
   * Walks a pending jump forward one page at a time.
   *
   * Re-runs whenever `data` changes, which is exactly when a freshly fetched
   * page has arrived, so there is no polling and no arbitrary wait between
   * attempts - the fetch resolving is the signal.
   */
  useEffect(() => {
    const pending = pendingJump.current;
    if (!pending) return;

    const index = findMessageIndex(pending.id);
    if (index !== -1) {
      pendingJump.current = null;
      scrollToIndex(index);
      return;
    }

    if (!hasOlder || pending.pages >= MAX_JUMP_PAGES) {
      pendingJump.current = null;
      errorToast({ title: "Message is no longer available" });
      return;
    }

    pending.pages += 1;
    loadOlderOnce();
  }, [data, hasOlder, findMessageIndex, scrollToIndex, loadOlderOnce]);

  /**
   * FlatList cannot scroll to a row whose height it has not measured. Jump to
   * the nearest row it *has* measured, which gets the target into the render
   * window, then retry once it has been laid out.
   *
   * This is also why the list no longer supplies `getItemLayout`: handing it
   * invented per-row heights made it skip this entirely and scroll to a
   * fabricated offset, which is what put replies in roughly the right part of
   * the screen instead of on the right message.
   */
  const onScrollToIndexFailed = useCallback(
    (info: {
      index: number;
      averageItemLength: number;
      highestMeasuredFrameIndex: number;
    }) => {
      const anchor = Math.min(info.index, info.highestMeasuredFrameIndex);
      listRef.current?.scrollToOffset({
        offset: info.averageItemLength * anchor,
        animated: true,
      });
      setTimeout(() => scrollToIndex(info.index), SCROLL_RETRY_MS);
    },
    [listRef, scrollToIndex],
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
    <FlatList
      ref={listRef}
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListEmptyComponent={ListEmpty}
      ListHeaderComponent={ListHeader}
      ListFooterComponent={ListFooter}
      inverted
      onScrollToIndexFailed={onScrollToIndexFailed}
      onEndReached={loadOlder}
      ItemSeparatorComponent={ItemSeparator}
      contentContainerStyle={contentContainerStyle}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      initialNumToRender={20}
      maxToRenderPerBatch={10}
      windowSize={30}
      updateCellsBatchingPeriod={10}
      removeClippedSubviews
      scrollEventThrottle={16}
      onEndReachedThreshold={0.5}
      renderScrollComponent={memoList}
    />
  );
};
