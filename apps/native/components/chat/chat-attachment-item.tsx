import type { ChatAttachmentItem as ChatAttachmentItemType } from "@kosh-app/api/routers/chat";
import { formatBytes } from "@kosh-app/utils";
import { Link } from "expo-router";
import { memo } from "react";
import { TouchableOpacity, View } from "react-native";
import { StyledImage } from "../styled-image";
import { ThemedText } from "../themed-text";

export const ChatAttachmentImpl = ({
  item,
  cellSize,
}: {
  item: ChatAttachmentItemType;
  cellSize: number;
}) => {
  if (item.isImage) {
    return (
      <Link
        href={{ pathname: "/view/[image]", params: { image: item.url } }}
        asChild
      >
        <TouchableOpacity
          activeOpacity={0.7}
          className="p-0.5"
          style={{ height: cellSize }}
          accessibilityRole="imagebutton"
          accessibilityLabel={item.name ?? "Shared photo"}
          accessibilityHint="Tap to view full screen"
        >
          <StyledImage
            source={item.url}
            className="flex-1"
            contentFit="cover"
            transition={150}
          />
        </TouchableOpacity>
      </Link>
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

export const ChatAttachmentItem = memo(
  ChatAttachmentImpl,
  (prev, next) =>
    prev.cellSize === next.cellSize &&
    prev.item.url === next.item.url &&
    prev.item.name === next.item.name &&
    prev.item.size === next.item.size &&
    prev.item.isImage === next.item.isImage,
);
