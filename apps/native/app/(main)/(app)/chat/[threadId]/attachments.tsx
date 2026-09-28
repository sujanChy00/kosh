import { ErrorComponent } from "@/components/layout/error-component";
import { ListFetchingMoreComponent } from "@/components/layout/list-fetching-more-component";
import { StyledImage } from "@/components/styled-image";
import { StyledSymbolView } from "@/components/styled-symbol-view";
import { ThemedText } from "@/components/themed-text";
import { Card } from "@/components/ui/card";
import { trpc } from "@/utils/trpc";
import type { ChatAttachmentItem } from "@kosh-app/api/routers/chat";
import { formatBytes } from "@kosh-app/utils";
import { LegendList } from "@legendapp/list/react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  useWindowDimensions,
  View,
} from "react-native";

const PAGE_SIZE = 24;
const COLUMNS = 3;

const ChatAttachments = () => {
  const router = useRouter();
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const { width } = useWindowDimensions();

  /**
   * A grid cell is always a square, and its width is fixed by the column count,
   * so the height is derived rather than measured. Recomputed on rotation and
   * window resize because `width` is reactive.
   */
  const cellSize = Math.floor(width / COLUMNS);

  const {
    data,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isRefetching,
    isPending,
    error,
    isError,
    refetch,
  } = useInfiniteQuery(
    trpc.chat.attachments.infiniteQueryOptions(
      { threadId, limit: PAGE_SIZE },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );

  /**
   * Keyed by the server's `messageId:url` rather than deduped by hand. Two
   * messages can legitimately carry the same file, and each deserves its own
   * tile - the same image sent twice is not a duplicate row.
   */
  const attachments = useMemo(
    () => (data?.pages ?? []).flatMap((page) => page.items),
    [data],
  );

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // The real file count, not `attachments.length` - that only counts loaded
  // pages, so the title would climb as the user scrolled. Counted server-side
  // on the first page only.
  const total = data?.pages[0]?.total ?? attachments.length;

  const keyExtractor = useCallback((item: ChatAttachmentItem) => item.key, []);

  const renderItem = useCallback(
    ({ item }: { item: ChatAttachmentItem }) => (
      <AttachmentTile
        item={item}
        cellSize={cellSize}
        onPress={() =>
          router.push({
            pathname: "/view/[image]",
            params: { image: item.url },
          })
        }
      />
    ),
    [cellSize, router],
  );

  const ListEmpty = useMemo(() => {
    if (isPending) {
      return (
        <View className="py-10 items-center justify-center">
          <ActivityIndicator />
        </View>
      );
    }
    return (
      <Card className="p-8 items-center justify-center gap-y-2">
        <StyledSymbolView
          tintColorClassName="text-muted-foreground"
          size={32}
          name={{ ios: "photo.on.rectangle", android: "image" }}
        />
        <ThemedText className="text-muted-foreground text-sm font-mono-regular text-center">
          No attachments yet. Photos and files shared in this chat show up here.
        </ThemedText>
      </Card>
    );
  }, [isPending]);

  const ListFooter = useMemo(
    () => (
      <ListFetchingMoreComponent
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
      />
    ),
    [isFetchingNextPage, hasNextPage],
  );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isError) {
    return (
      <ErrorComponent
        refetch={handleRefresh}
        message={error?.message ?? "Failed to load attachments."}
      />
    );
  }

  return (
    <>
      <Stack.Title>Attachments ({total})</Stack.Title>

      <LegendList
        data={attachments}
        numColumns={COLUMNS}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        onEndReached={loadMore}
        recycleItems
        onEndReachedThreshold={0.5}
        onRefresh={handleRefresh}
        refreshing={isRefetching}
        estimatedItemSize={cellSize}
        contentContainerClassName="pb-safe-offset-10 p-0.5"
        showsVerticalScrollIndicator={false}
      />
    </>
  );
};

const AttachmentTile = ({
  item,
  cellSize,
  onPress,
}: {
  item: ChatAttachmentItem;
  cellSize: number;
  onPress: () => void;
}) => {
  // p-0.5 on each side is the gutter: it eats 4px of the cell, and the tile
  // fills what is left via flex-1, so the grid needs no width arithmetic.
  if (item.isImage) {
    return (
      <View className="p-0.5" style={{ height: cellSize }}>
        <Pressable
          className="flex-1"
          onPress={onPress}
          accessibilityRole="imagebutton"
          accessibilityLabel={item.name ?? "Shared photo"}
          accessibilityHint="Tap to view full screen"
        >
          <StyledImage
            source={{ uri: item.url }}
            className="flex-1"
            contentFit="cover"
            transition={150}
          />
        </Pressable>
      </View>
    );
  }

  const extension = (item.name?.split(".").pop() ?? "file")
    .slice(0, 4)
    .toUpperCase();
  const size = item.size ? formatBytes(item.size) : null;

  return (
    <View className="p-0.5" style={{ height: cellSize }}>
      <View className="flex-1 bg-surface-tertiary items-center justify-center gap-y-1 p-1">
        <ThemedText className="text-primary text-[10px] font-notosans-semibold">
          {extension}
        </ThemedText>
        <ThemedText
          numberOfLines={2}
          className="text-muted-foreground text-[10px] text-center"
        >
          {item.name ?? "File"}
        </ThemedText>
        {size && (
          <ThemedText className="text-muted-foreground text-[9px]">
            {size}
          </ThemedText>
        )}
      </View>
    </View>
  );
};

export default ChatAttachments;
