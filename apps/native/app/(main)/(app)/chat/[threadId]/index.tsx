import { ChatThreadComposer } from "@/components/chat/chat-thread-composer";
import { ChatThreadHeader } from "@/components/chat/chat-thread-header";
import { ChatTranscript } from "@/components/chat/chat-transcript";
import { MessageActionsSheet } from "@/components/chat/message-actions-sheet";
import { ErrorComponent } from "@/components/layout/error-component";
import {
  ChatThreadProvider,
  useChatThreadView,
} from "@/contexts/chat-thread-context";
import { useLocalSearchParams } from "expo-router";

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
  const { isHistoryError, errorMessage, refresh } = useChatThreadView();

  if (isHistoryError) {
    return <ErrorComponent refetch={refresh} message={errorMessage} />;
  }

  return (
    <>
      <ChatThreadHeader />
      <ChatTranscript />
      <MessageActionsSheet />
      <ChatThreadComposer />
    </>
  );
};

export default ChatThreadScreen;
