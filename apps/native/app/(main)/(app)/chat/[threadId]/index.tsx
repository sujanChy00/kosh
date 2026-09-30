import { ChatThreadComposer } from "@/components/chat/chat-thread-composer";
import { ChatThreadHeader } from "@/components/chat/chat-thread-header";
import { ChatTranscript } from "@/components/chat/chat-transcript";
import { MessageActionsSheet } from "@/components/chat/message-actions-sheet";
import { ErrorComponent } from "@/components/layout/error-component";
import { useAppTheme } from "@/contexts/app-theme-context";
import {
  ChatThreadProvider,
  useChatComposerContext,
  useChatThreadView,
} from "@/contexts/chat-thread-context";
import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";

/**
 * An open chat thread.
 *
 * The route is only responsible for reading the route param and mounting the
 * provider; everything the screen shows reads its own slice of context. The
 * error case is the one exception - it has to run before the provider's children
 * are considered renderable, since a failed history query means there is no
 * transcript to show.
 */
const ChatThreadScreen = () => {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();

  return (
    <ChatThreadProvider threadId={threadId}>
      <ChatThreadContent />
    </ChatThreadProvider>
  );
};

const ChatThreadContent = () => {
  const composer = useChatComposerContext();
  const { colors } = useAppTheme();
  const { isHistoryError, errorMessage, refresh } = useChatThreadView();
  if (isHistoryError) {
    return <ErrorComponent refetch={refresh} message={errorMessage} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ChatThreadHeader />
      <ChatTranscript />
      <MessageActionsSheet />
      <ChatThreadComposer
        value={composer.draft}
        onChangeText={composer.setDraft}
        onSend={composer.send}
        onPickImage={composer.pickImage}
        uploading={composer.uploading}
        target={composer.target}
        onCancelTarget={composer.cancelTarget}
        onConfirmEdit={composer.confirmEdit}
      />
    </View>
  );
};

export default ChatThreadScreen;
