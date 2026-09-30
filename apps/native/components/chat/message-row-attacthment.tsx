import type { ChatMessageItem } from "@kosh-app/api/routers/chat";
import { cn, formatBytes } from "@kosh-app/utils";
import { ActivityIndicator, Pressable, View } from "react-native";
import { FadeIn, FadeOut } from "react-native-reanimated";
import { AnimatedView } from "../animated-view";
import { StyledImage } from "../styled-image";
import { ThemedText } from "../themed-text";

interface AttachmentProps {
  attachment: NonNullable<ChatMessageItem["attachments"]>[number];
  isMine: boolean;
  onPress: (url: string) => void;
  onLongPress?: () => void;
  isUploading: boolean;
}

export function MessageRowAttachment({
  attachment,
  isMine,
  onPress,
  onLongPress,
  isUploading = false,
}: AttachmentProps) {
  const isImage =
    !attachment.mimeType || attachment.mimeType.startsWith("image/");

  if (isImage) {
    return (
      <Pressable
        onPress={isUploading ? undefined : () => onPress(attachment.url)}
        onLongPress={onLongPress}
        delayLongPress={280}
        accessibilityRole="imagebutton"
        accessibilityLabel={attachment.name ?? "Photo attachment"}
        className="size-56 rounded-xl relative overflow-hidden"
        accessibilityHint="Tap to view full screen, long press for actions"
      >
        {isUploading && (
          <AnimatedView
            entering={FadeIn}
            exiting={FadeOut}
            className="absolute size-full z-20 bg-black/60 items-center justify-center"
          >
            <ActivityIndicator />
          </AnimatedView>
        )}
        <StyledImage
          source={{ uri: attachment.url }}
          className="size-full"
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
