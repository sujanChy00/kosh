import { useShareImage } from "@/hooks/use-share-image";
import { successToast } from "@/utils/toast";
import type { ChatMessageItem } from "@kosh-app/api/routers/chat";
import {
  isCopyableText,
  isShareableImage,
  type MessageAction,
} from "@kosh-app/utils";
import * as Clipboard from "expo-clipboard";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { ChatOptimistic } from "./use-chat-optimistic";
import type { ChatTranscript } from "./use-chat-transcript";
import { useHaptics } from "./use-haptics";
import { useKeyboard } from "./use-keyboard";

export type MessageActions = {
  /** Opens the sheet against a message id. Called by each transcript row. */
  openMessage: (messageId: string) => void;
  /** The sheet's `visible` gate: something is targeted and it is not a tombstone. */
  isOpen: boolean;
  isFailed: boolean;
  canReply: boolean;
  canReact: boolean;
  canCopy: boolean;
  canShare: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onClose: () => void;
  onReact: (emoji: string) => void;
  onAction: (action: MessageAction) => void;
};

type UseMessageActionsOptions = {
  transcript: ChatTranscript;
  optimistic: ChatOptimistic;
  /**
   * The composer owns draft and target, so it also owns how a reply or an edit
   * is started. Passing the two starters in - rather than reaching sideways
   * into the composer's state - is what keeps this hook a leaf: it never needs
   * to know what a draft is.
   */
  onReply: (message: ChatMessageItem) => void;
  onEdit: (message: ChatMessageItem) => void;
};

/**
 * Derives everything the long-press actions sheet needs from the one piece of
 * state it owns: the id of the message it is pointed at.
 *
 * Only the id is held, never the message. The sheet is mounted once at screen
 * level, so with `recycleItems` a row can be handed a different message while
 * its own sheet is open; resolving the id against the transcript on every read
 * means the sheet always follows the id the user actually pressed.
 */
export const useMessageActions = ({
  transcript,
  optimistic,
  onReply,
  onEdit,
}: UseMessageActionsOptions): MessageActions => {
  const { dismissKeyboard } = useKeyboard();
  const haptics = useHaptics();
  const { history, recent, myUserId } = transcript;
  const { pending, patches } = optimistic;

  const [messageId, setMessageId] = useState<string | null>(null);

  const messageById = useMemo(() => {
    const map = new Map<string, ChatMessageItem>();
    for (const item of [...history, ...recent]) map.set(item.id, item);
    for (const item of pending) {
      map.set(`pending:${item.clientId}`, item.message);
    }
    return map;
  }, [history, recent, pending]);

  const message = messageId ? (messageById.get(messageId) ?? null) : null;

  const isPending = message?.id.startsWith("pending:") ?? false;

  // A soft-deleted message is a tombstone. The rows are already inert to
  // long-press, but the id can also be left over from a message that got
  // deleted while its sheet was open, so `visible` is gated on it too.
  //
  // The optimistic half reads `deletedAt` off the patch, not the patch's mere
  // existence. That map also carries reaction patches, and treating any patch
  // as a deletion made a live message look like a tombstone for as long as a
  // reaction was in flight - which closed the sheet the instant you reacted.
  const patch = message ? patches.get(message.id) : undefined;
  const isDeleted = message?.deletedAt != null || patch?.deletedAt != null;

  /**
   * Whether the sheet is pointed at the current user's own message. Derived from
   * the sender in the transcript rather than trusted from the row, so it cannot
   * be spoofed by a stale or optimistic row - the server re-checks ownership
   * regardless.
   */
  const isOwn = message?.senderId === myUserId;

  /**
   * Share target. `useShareImage` binds the URL when the hook is called, so the
   * URL has to live in state and the share is kicked off from an effect once the
   * hook has picked it up - calling `shareImage` in the same tick as `setShareUrl`
   * would run it against the previous render's URL.
   */
  const [shareUrl, setShareUrl] = useState<string>();
  const { downloadImage: shareImage } = useShareImage(shareUrl);

  useEffect(() => {
    if (!shareUrl) return;
    shareImage();
    setShareUrl(undefined);
  }, [shareUrl, shareImage]);

  const onAction = useCallback(
    (action: MessageAction) => {
      if (!message) return;

      switch (action) {
        case "reply":
          onReply(message);
          return;
        case "copy": {
          // The row's text is `selectable`, but the wrapping Pressable claims
          // the long press first at 280ms, so the native selection handles never
          // surface. The sheet is the only reachable way to copy, which makes
          // this the action that has to be right.
          if (!isCopyableText(message)) return;
          Clipboard.setStringAsync(message.content).then(() => {
            successToast({ title: "Message copied" });
          });
          return;
        }
        case "edit":
          onEdit(message);
          return;
        case "delete":
          optimistic.deleteMessage(message.id);
          return;
        case "share": {
          const url = message.attachments?.[0]?.url;
          // Only a confirmed, remote image can be shared: a pending bubble holds
          // a local file URI, and `File.downloadFileAsync` needs an http(s) one.
          // `isShareableImage` states that rule once, for the gate and for the
          // handler, so the two cannot drift apart.
          if (isShareableImage(message) && url) setShareUrl(url);
          return;
        }
        case "retry": {
          const clientId = message.clientId;
          if (!clientId) return;

          const item = pending.find((p) => p.clientId === clientId);

          // An image keeps its on-device file, so retry re-runs the whole
          // upload-and-send against that local URI rather than making the user
          // go back to the photo picker. Reusing the clientId also keeps the
          // retry idempotent server-side.
          if (item?.localUri) {
            void optimistic.uploadAndSend(
              clientId,
              item.localUri,
              item.message.attachments?.[0]?.name ?? "Photo",
              item.message.attachments?.[0]?.mimeType,
            );
            return;
          }

          // Nothing local to retry from (a text send), so drop the failed
          // placeholder rather than leaving a permanently dead bubble.
          optimistic.dropPending(clientId);
          return;
        }
      }
    },
    [message, pending, onReply, onEdit, optimistic],
  );

  const onClose = useCallback(() => setMessageId(null), []);
  const openMessage = useCallback(
    (id: string) => {
      haptics("impact-light");
      setMessageId(id);
      void dismissKeyboard();
    },
    [dismissKeyboard],
  );

  const onReact = useCallback(
    (emoji: string) => {
      if (message) optimistic.react(message, emoji);
    },
    [message, optimistic],
  );

  /**
   * Edit and delete are author-only. The server enforces this in
   * `requireOwnMessage`, so gating here keeps the sheet from ever offering an
   * action that would come back FORBIDDEN.
   */
  const canAct = !isPending && !isDeleted;
  const canShare = canAct && isShareableImage(message);
  const canCopy = canAct && isCopyableText(message);
  const canEdit = canAct && !!isOwn && message?.type === "text";
  const canDelete = canAct && !!isOwn;
  const isOpen = message !== null && !isDeleted;

  return useMemo(
    () => ({
      openMessage,
      isOpen,
      isFailed: isPending,
      canReply: canAct,
      canReact: canAct,
      canCopy,
      canShare,
      canEdit,
      canDelete,
      onClose,
      onReact,
      onAction,
    }),
    [
      openMessage,
      isOpen,
      isPending,
      canAct,
      canCopy,
      canShare,
      canEdit,
      canDelete,
      onClose,
      onReact,
      onAction,
    ],
  );
};
