import { cn, formatMessageTime } from "@kosh-app/utils";
import { View } from "react-native";
import { FadeIn, FadeOut } from "react-native-reanimated";
import { AnimatedText } from "../animated-text";

interface Props {
  isMine: boolean;
  message: {
    createdAt: string;
    editedAt: string | null;
  };
  isSending: boolean;
  failed: boolean;
  isDeleted: boolean;
}

export const MessageRowStatus = ({
  isMine,
  message,
  isSending = false,
  failed,
  isDeleted,
}: Props) => {
  return (
    <View
      className={cn(
        "flex-row items-center gap-1 mt-0.5",
        isMine ? "justify-end" : "justify-start",
      )}
    >
      {!isSending && (
        <AnimatedText
          entering={FadeIn}
          className="text-muted-foreground text-[10px] font-mono-medium-italic"
        >
          {formatMessageTime(message.createdAt)}
        </AnimatedText>
      )}
      {message.editedAt && !isDeleted && !isSending && (
        <AnimatedText
          entering={FadeIn}
          className="text-muted-foreground text-[10px] font-notosans-italic"
        >
          edited
        </AnimatedText>
      )}

      {isSending && (
        <AnimatedText
          entering={FadeIn}
          exiting={FadeOut}
          className="text-muted-foreground text-[10px] font-notosans-italic"
        >
          Sending…
        </AnimatedText>
      )}
      {failed && !isSending && (
        <AnimatedText
          entering={FadeIn}
          exiting={FadeOut}
          className="text-danger text-[10px] font-notosans-semibold"
        >
          Failed · tap to retry
        </AnimatedText>
      )}
    </View>
  );
};
