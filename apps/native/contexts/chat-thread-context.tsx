import {
  useChatComposer,
  type ChatComposerState,
} from "@/hooks/use-chat-composer";
import { useChatOptimistic } from "@/hooks/use-chat-optimistic";
import {
  useChatTranscript,
  type ChatTranscript,
} from "@/hooks/use-chat-transcript";
import {
  useMessageActions,
  type MessageActions,
} from "@/hooks/use-message-actions";
import { buildChatEntries, type ChatListEntry } from "@kosh-app/utils";
import { createContext, useContext, useMemo, type ReactNode } from "react";

/**
 * One thread's worth of chat state, assembled in a fixed order and handed out
 * through three separate contexts.
 *
 * Separate contexts rather than one wide value because the three consumers churn
 * for different reasons: the transcript moves on a 3s poll, the actions sheet
 * only on a long-press, the composer on every keystroke. A single value would
 * re-render the whole transcript on each character typed, so each context holds
 * only what its own consumer reads.
 *
 * The layering is a DAG, not a cycle:
 *
 *   transcript (server truth)
 *     -> optimistic (local guesses: pending rows, patches)
 *       -> composer (input state)
 *         -> message actions (the sheet, which hands a chosen message back to
 *            the composer through `beginReply` / `beginEdit`)
 */

export type ChatThreadView = ChatTranscript & {
  /**
   * The folded transcript, built here rather than in the list so that the
   * expensive merge of history, recent, pending rows and patches happens once
   * per change instead of once per consumer that happens to need it.
   */
  entries: ChatListEntry[];
};

const ViewContext = createContext<ChatThreadView | undefined>(undefined);
const ComposerContext = createContext<ChatComposerState | undefined>(undefined);
const ActionsContext = createContext<MessageActions | undefined>(undefined);

export const ChatThreadProvider = ({
  threadId,
  children,
}: {
  threadId: string;
  children: ReactNode;
}) => {
  const transcript = useChatTranscript(threadId);

  const optimistic = useChatOptimistic({
    threadId,
    myUserId: transcript.myUserId,
    me: transcript.me,
    refetchThread: transcript.refetchThread,
    invalidateThreadLists: transcript.invalidateThreadLists,
  });

  const composer = useChatComposer({ transcript, optimistic });

  const actions = useMessageActions({
    transcript,
    optimistic,
    onReply: composer.beginReply,
    onEdit: composer.beginEdit,
  });

  const { isGroup, myUserId, history, recent } = transcript;
  const { pending, patches } = optimistic;

  const entries = useMemo(
    () =>
      buildChatEntries(history, recent, pending, patches, {
        isGroup,
        myUserId,
      }),
    [history, recent, pending, patches, isGroup, myUserId],
  );

  const view = useMemo(
    () => ({ ...transcript, entries }),
    [transcript, entries],
  );

  return (
    <ViewContext.Provider value={view}>
      <ComposerContext.Provider value={composer}>
        <ActionsContext.Provider value={actions}>
          {children}
        </ActionsContext.Provider>
      </ComposerContext.Provider>
    </ViewContext.Provider>
  );
};

function useRequired<T>(context: React.Context<T | undefined>, name: string) {
  const value = useContext(context);
  if (!value) {
    throw new Error(`${name} must be used within ChatThreadProvider`);
  }
  return value;
}

/** Transcript data, the header's fields, and the built list. */
export const useChatThreadView = () =>
  useRequired(ViewContext, "useChatThreadView");

/** Draft, reply/edit target and the send path. */
export const useChatComposerContext = () =>
  useRequired(ComposerContext, "useChatComposerContext");

/** The actions sheet's permissions and handlers, plus how to open it. */
export const useMessageActionsContext = () =>
  useRequired(ActionsContext, "useMessageActionsContext");
