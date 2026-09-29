import { Pressable, View } from "react-native";
import { StyledSymbolView } from "../styled-symbol-view";
import { ThemedText } from "../themed-text";
import { ComposerTarget } from "./chat-composer";

interface Props {
  target: ComposerTarget;
  onCancel: () => void;
}

export function ChatReplyTextHolder({ target, onCancel }: Props) {
  const { message, mode } = target;
  const quoted = message.deletedAt
    ? "Deleted message"
    : (message.content ?? (message.attachments?.length ? "Sent a photo" : ""));

  return (
    <View className="flex-row items-center gap-2 p-3 pt-0">
      <View className="flex-1 min-w-0 bg-surface-secondary gap-y-1 p-2 py-3 rounded-2xl">
        <ThemedText
          selectable={false}
          numberOfLines={1}
          className="text-primary text-[11px] font-notosans-semibold"
        >
          {mode === "edit"
            ? "Editing message"
            : `Replying to ${message.sender.name}`}
        </ThemedText>
        <ThemedText
          selectable={false}
          numberOfLines={1}
          className="text-muted-foreground text-[11px]"
        >
          {quoted}
        </ThemedText>
      </View>
      <Pressable
        onPress={onCancel}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={mode === "edit" ? "Cancel editing" : "Cancel reply"}
        className="p-1"
      >
        <StyledSymbolView size={16} name={{ ios: "xmark", android: "close" }} />
      </Pressable>
    </View>
  );
}
