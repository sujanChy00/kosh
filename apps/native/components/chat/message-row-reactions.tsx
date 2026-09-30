import { ChatMessageItem } from "@kosh-app/api/routers/chat";
import { cn } from "@kosh-app/utils";
import { View } from "react-native";
import { ThemedText } from "../themed-text";
interface Props {
  reactions: ChatMessageItem["reactions"];
  isMine: boolean;
}
export const MessageRowReactions = ({ reactions, isMine }: Props) => {
  if (!reactions || reactions.length === 0) return null;

  return (
    <View className="flex-row flex-wrap gap-1 -translate-y-2">
      {reactions.map((reaction) => (
        <View
          key={reaction.emoji}
          className={cn(
            "flex-row items-center gap-0.5 self-start px-1.5 py-0.5 rounded-full border",
            !isMine
              ? "border-primary bg-primary/80"
              : "border-border bg-surface",
          )}
        >
          <ThemedText className="text-xs">{reaction.emoji}</ThemedText>
          {reaction.userIds.length > 1 && (
            <ThemedText className="text-muted-foreground text-[10px]">
              {reaction.userIds.length}
            </ThemedText>
          )}
        </View>
      ))}
    </View>
  );
};
