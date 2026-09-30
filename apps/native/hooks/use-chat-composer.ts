import type { ComposerTarget } from "@/components/chat/chat-thread-composer";
import { errorToast } from "@/utils/toast";
import type { ChatMessageItem } from "@kosh-app/api/routers/chat";
import { createMessageClientId } from "@kosh-app/utils";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useMemo, useState } from "react";

import type { ChatOptimistic } from "./use-chat-optimistic";
import type { ChatTranscript } from "./use-chat-transcript";

interface ChatComposerProps {
  transcript: ChatTranscript;
  optimistic: ChatOptimistic;
  scrollToEnd: () => void;
}

export type ChatComposerState = {
  draft: string;
  target: ComposerTarget | null;
  uploading: boolean;
  setDraft: (text: string) => void;
  send: () => void;
  pickImage: () => Promise<void>;
  cancelTarget: () => void;
  confirmEdit: (content: string) => void;
  beginReply: (message: ChatMessageItem) => void;
  beginEdit: (message: ChatMessageItem) => void;
};

/**
 * Draft text, the reply/edit target banner, and the send path.
 *
 * Also the starting point for a reply or an edit, so the actions sheet can hand
 * a chosen message over without knowing that a "draft" exists.
 */
export const useChatComposer = ({
  transcript,
  optimistic,
  scrollToEnd,
}: ChatComposerProps): ChatComposerState => {
  const { threadId, myUserId, me } = transcript;

  const [draft, setDraft] = useState("");
  const [target, setTarget] = useState<ComposerTarget | null>(null);
  // Read, not owned: `uploadAndSend` owns the flag so that a retry - which never
  // touches this hook - also shows up in the composer's attach button.
  const uploading = optimistic.uploading;

  const beginReply = useCallback((message: ChatMessageItem) => {
    setTarget({ mode: "reply", message });
  }, []);

  const beginEdit = useCallback((message: ChatMessageItem) => {
    setDraft(message.content ?? "");
    setTarget({ mode: "edit", message });
  }, []);

  const cancelTarget = useCallback(() => {
    setTarget(null);
    // An edit seeded the draft from the message, so cancelling has to put it
    // back; a reply must not wipe what the user had already typed.
    setDraft((current) => (target?.mode === "edit" ? "" : current));
  }, [target?.mode]);

  const confirmEdit = useCallback(
    (content: string) => {
      if (target?.mode !== "edit") return;
      optimistic.confirmEdit(target.message.id, content, () => {
        setTarget(null);
        setDraft("");
      });
    },
    [target, optimistic],
  );

  const send = useCallback(() => {
    const content = draft.trim();
    if (!content || !myUserId || !threadId) return;

    const clientId = createMessageClientId();
    const replied = target?.message ?? null;

    const localMessage: ChatMessageItem = {
      id: `pending:${clientId}`,
      clientId,
      threadId,
      senderId: myUserId,
      type: "text",
      content,
      attachments: null,
      createdAt: new Date().toISOString(),
      editedAt: null,
      deletedAt: null,
      sender: {
        id: myUserId,
        name: me?.name ?? "You",
        image: me?.image ?? null,
      },
      replyTo: replied
        ? {
            id: replied.id,
            senderId: replied.senderId,
            senderName: replied.sender.name,
            content: replied.content,
            attachments: replied.attachments,
            deletedAt: replied.deletedAt,
          }
        : null,
      reactions: [],
    };

    optimistic.addPending({
      clientId,
      state: "sending",
      message: localMessage,
    });

    scrollToEnd();
    setDraft("");
    setTarget(null);

    optimistic.sendText({
      threadId,
      clientId,
      content,
      replyToId: replied?.id ?? null,
    });
  }, [draft, myUserId, threadId, target, me, optimistic, scrollToEnd]);

  const pickImage = useCallback(async () => {
    if (uploading || !threadId || !myUserId) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      errorToast({ title: "Allow photo access to attach an image" });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) return;

    // Minted before the upload, not after, so the placeholder, the upload and
    // the mutation all agree on one clientId. That agreement is what lets
    // `buildChatEntries` swap the placeholder for the confirmed row.
    const clientId = createMessageClientId("image");
    const name = asset.fileName ?? "Photo";
    const mimeType = asset.mimeType;

    // The bubble goes up immediately, rendering the local file, so the tap is
    // acknowledged straight away rather than after a multi-second upload.
    optimistic.addPending({
      clientId,
      state: "uploading",
      localUri: asset.uri,
      message: {
        id: `pending:${clientId}`,
        clientId,
        threadId,
        senderId: myUserId,
        type: "image",
        content: null,
        attachments: [
          {
            url: asset.uri,
            name,
            mimeType: mimeType ?? "image/jpeg",
            size: asset.fileSize,
          },
        ],
        createdAt: new Date().toISOString(),
        editedAt: null,
        deletedAt: null,
        sender: {
          id: myUserId,
          name: me?.name ?? "You",
          image: me?.image ?? null,
        },
        replyTo: null,
        reactions: [],
      },
    });
    scrollToEnd();

    await optimistic.uploadAndSend(clientId, asset.uri, name, mimeType);
  }, [uploading, threadId, myUserId, me, optimistic, scrollToEnd]);
  return useMemo(
    () => ({
      draft,
      target,
      uploading,
      setDraft,
      send,
      pickImage,
      cancelTarget,
      confirmEdit,
      beginReply,
      beginEdit,
    }),
    [
      draft,
      target,
      uploading,
      send,
      pickImage,
      cancelTarget,
      confirmEdit,
      beginReply,
      beginEdit,
    ],
  );
};
