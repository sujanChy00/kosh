import { uploadChatImage } from "@/lib/cloudinary";
import { errorToast } from "@/utils/toast";
import { trpc } from "@/utils/trpc";
import type {
  ChatAttachment,
  ChatMessageItem,
} from "@kosh-app/api/routers/chat";
import type { MessagePatch, PendingMessage } from "@kosh-app/utils";
import { toggleReactionLocal } from "@kosh-app/utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";

const RECONCILE_TIMEOUT_MS = 10_000;

type UseChatOptimisticOptions = {
  threadId: string;
  myUserId: string;
  me: { name?: string | null; image?: string | null } | undefined;
  refetchThread: () => Promise<void>;
  invalidateThreadLists: () => void;
};

export type ChatOptimistic = {
  pending: PendingMessage[];
  patches: Map<string, MessagePatch>;
  /**
   * Owned here rather than in the composer because the retry path uploads too:
   * a retry can start without the composer ever being involved, and the picker's
   * attach button has to reflect both.
   */
  uploading: boolean;
  addPending: (item: PendingMessage) => void;
  sendText: (vars: {
    threadId: string;
    clientId: string;
    content: string;
    replyToId: string | null;
  }) => void;
  uploadAndSend: (
    clientId: string,
    localUri: string,
    name: string,
    mimeType: string | undefined,
  ) => Promise<void>;
  confirmEdit: (messageId: string, content: string, onDone: () => void) => void;
  deleteMessage: (messageId: string) => void;
  react: (message: ChatMessageItem, emoji: string) => void;
  dropPending: (clientId: string) => void;
};

/**
 * The locally-owned half of the transcript: pending sends and optimistic
 * patches, plus every mutation that touches them.
 *
 * This is where the "guess, then confirm" behaviour lives, and it is the reason
 * `pending` and `patches` have to be one layer rather than two - a retry reads
 * the pending row's `localUri` that the same layer created, and a reaction
 * patch has to survive a delete patch on the same message. Each patch is dropped
 * as soon as its mutation settles, leaving the polled server rows as the only
 * source of truth.
 */
export const useChatOptimistic = ({
  threadId,
  myUserId,
  me,
  refetchThread,
  invalidateThreadLists,
}: UseChatOptimisticOptions): ChatOptimistic => {
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [uploading, setUploading] = useState(false);

  // In-flight optimistic edits to confirmed messages, keyed by message id.
  // Cleared when the mutation settles - success or failure - so the polled
  // server rows are always the final word.
  const [patches, setPatches] = useState<Map<string, MessagePatch>>(
    () => new Map(),
  );

  /**
   * Drops an optimistic patch once the server row it stood in for is in the
   * cache, so the polled data becomes the only thing driving the row. Until
   * then the patch is what hides the reaction chip or flips the tombstone.
   */
  const clearPatch = useCallback((messageId: string) => {
    setPatches((current) => {
      if (!current.has(messageId)) return current;
      const next = new Map(current);
      next.delete(messageId);
      return next;
    });
  }, []);

  /**
   * Moves a pending row to a new delivery state. Every transition goes through
   * here so the four states stay in one place rather than being spelled out at
   * each call site.
   */
  const setPendingState = useCallback(
    (clientId: string, state: PendingMessage["state"]) => {
      setPending((current) =>
        current.map((item) =>
          item.clientId === clientId ? { ...item, state } : item,
        ),
      );
    },
    [],
  );

  const sendMutation = useMutation(
    trpc.chat.send.mutationOptions({
      onError: (error, variables) => {
        // Keep the bubble on screen as a retryable failure rather than
        // discarding what the user typed.
        setPendingState(variables.clientId, "failed");
        errorToast({ title: error.message || "Failed to send message" });
      },
      onSuccess: (_data, variables) => {
        // Deliberately NOT removed here. The confirmed copy only exists once a
        // refetch returns it, and `recent` polls on a 3s interval. Dropping the
        // pending entry on success therefore leaves a window where the message
        // is in neither list and the bubble visibly disappears and reappears.
        // `buildChatEntries` already hides a pending entry as soon as a message
        // with the same clientId shows up, so keeping it hands over seamlessly.
        setPendingState(variables.clientId, "sent");
        invalidateThreadLists();
        // Pull the confirmed row now rather than waiting out the poll, so the
        // handover is one round trip instead of up to three seconds.
        void refetchThread();
      },
    }),
  );

  /**
   * Backstop for a `sent` placeholder that never gets replaced - e.g. the
   * refetch failed and the poll is erroring. The server has the row, so
   * dropping the placeholder can at worst let the next good poll re-show it;
   * keeping it forever would show a permanent duplicate. The timer is set to
   * the point the oldest `sent` entry crosses the threshold, not a flat delay,
   * so it does not drift on every state change.
   */
  useEffect(() => {
    const sent = pending.filter((item) => item.state === "sent");
    if (sent.length === 0) return;

    const oldest = Math.min(
      ...sent.map((item) => new Date(item.message.createdAt).getTime()),
    );
    const remaining = RECONCILE_TIMEOUT_MS - (Date.now() - oldest);

    const timer = setTimeout(
      () => {
        setPending((current) =>
          current.filter(
            (item) =>
              item.state !== "sent" ||
              Date.now() - new Date(item.message.createdAt).getTime() <
                RECONCILE_TIMEOUT_MS,
          ),
        );
      },
      Math.max(remaining, 0),
    );

    return () => clearTimeout(timer);
  }, [pending]);

  const editMutation = useMutation(
    trpc.chat.editMessage.mutationOptions({
      onMutate: ({ messageId, content }) => {
        setPatches((current) => {
          const next = new Map(current);
          const existing = next.get(messageId);
          next.set(messageId, {
            ...existing,
            content,
            editedAt: new Date().toISOString(),
          });
          return next;
        });
      },
      onSuccess: async (_, { messageId }) => {
        await refetchThread();
        clearPatch(messageId);
      },
      onError: (error, { messageId }) => {
        clearPatch(messageId);
        void refetchThread();
        errorToast({ title: error.message || "Failed to edit message" });
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.chat.deleteMessage.mutationOptions({
      onMutate: ({ messageId }) => {
        setPatches((current) => {
          const next = new Map(current);
          next.set(messageId, {
            ...next.get(messageId),
            // The tombstone also drops the reactions and the reply quote,
            // matching the server, which deletes the reaction rows and clears
            // `replyToId` along with the content.
            reactions: [],
            content: null,
            attachments: null,
            replyTo: null,
            deletedAt: new Date().toISOString(),
          });
          return next;
        });
      },
      onSuccess: async (_, { messageId }) => {
        await refetchThread();
        clearPatch(messageId);
        invalidateThreadLists();
      },
      onError: (error, { messageId }) => {
        // The message is still live, so drop the tombstone and re-read it.
        clearPatch(messageId);
        void refetchThread();
        errorToast({ title: error.message || "Failed to delete message" });
      },
    }),
  );

  const reactionMutation = useMutation(
    trpc.chat.toggleReaction.mutationOptions({
      onSuccess: async (_, { messageId }) => {
        await refetchThread();
        clearPatch(messageId);
      },
      onError: (error, { messageId }) => {
        clearPatch(messageId);
        void refetchThread();
        errorToast({ title: error.message || "Failed to update reaction" });
      },
    }),
  );

  /**
   * Flips the reaction locally before the mutation goes out. The server
   * toggles add-if-absent / remove-if-present, and the optimistic value is
   * computed with the same rule so the chip lands on the state the database
   * will actually hold.
   */
  const react = useCallback(
    (message: ChatMessageItem, emoji: string) => {
      if (!myUserId) return;

      setPatches((current) => {
        const next = new Map(current);
        const existing = next.get(message.id);
        next.set(message.id, {
          ...existing,
          reactions: toggleReactionLocal(
            existing?.reactions ?? message.reactions,
            emoji,
            myUserId,
          ),
        });
        return next;
      });

      reactionMutation.mutate({ messageId: message.id, emoji });
    },
    [myUserId, reactionMutation],
  );

  /**
   * Upload a local image and send it, driving the existing placeholder through
   * `uploading` -> `sending` -> (reconciled | `failed`).
   *
   * Shared by the initial send and by retry, so a retry is genuinely the same
   * path re-run from the on-device file rather than a second, subtly different
   * code path. The `clientId` is passed in and reused across attempts, which
   * also makes the retry idempotent server-side.
   */
  const uploadAndSend = useCallback(
    async (
      clientId: string,
      localUri: string,
      name: string,
      mimeType: string | undefined,
    ) => {
      if (!threadId) return;

      setUploading(true);
      try {
        const uploaded = await uploadChatImage(localUri);
        const attachment: ChatAttachment = {
          url: uploaded.url,
          name,
          mimeType: mimeType ?? uploaded.format ?? "image/jpeg",
          size: uploaded.bytes,
        };

        // Point the bubble at the CDN URL before sending, so the placeholder
        // and the confirmed row never disagree about which image this is.
        setPending((current) =>
          current.map((item) =>
            item.clientId === clientId
              ? {
                  ...item,
                  state: "sending" as const,
                  message: { ...item.message, attachments: [attachment] },
                }
              : item,
          ),
        );

        sendMutation.mutate({
          threadId,
          clientId,
          type: "image",
          attachments: [attachment],
        });
      } catch (error) {
        setPendingState(clientId, "failed");
        errorToast({
          title: error instanceof Error ? error.message : "Upload failed",
        });
      } finally {
        setUploading(false);
      }
    },
    [threadId, sendMutation, setPendingState],
  );

  const addPending = useCallback((item: PendingMessage) => {
    setPending((current) => [...current, item]);
  }, []);

  const sendText = useCallback(
    (vars: {
      threadId: string;
      clientId: string;
      content: string;
      replyToId: string | null;
    }) => {
      sendMutation.mutate(vars);
    },
    [sendMutation],
  );

  const dropPending = useCallback((clientId: string) => {
    setPending((current) =>
      current.filter((item) => item.clientId !== clientId),
    );
  }, []);

  const confirmEdit = useCallback(
    (messageId: string, content: string, onDone: () => void) => {
      editMutation.mutate({ messageId, content }, { onSuccess: onDone });
    },
    [editMutation],
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      deleteMutation.mutate({ messageId });
    },
    [deleteMutation],
  );

  return useMemo(
    () => ({
      pending,
      patches,
      uploading,
      addPending,
      sendText,
      uploadAndSend,
      confirmEdit,
      deleteMessage,
      react,
      dropPending,
    }),
    [
      pending,
      patches,
      uploading,
      addPending,
      sendText,
      uploadAndSend,
      confirmEdit,
      deleteMessage,
      react,
      dropPending,
    ],
  );
};
