import {
  ChatComposer,
  type ComposerTarget,
} from "@/components/chat/chat-composer";
import { DateSeparator } from "@/components/chat/date-separator";
import {
  MessageActionsSheet,
  type MessageAction,
} from "@/components/chat/message-actions-sheet";
import { MessageRow } from "@/components/chat/message-row";
import { ErrorComponent } from "@/components/layout/error-component";
import { ThemedText } from "@/components/themed-text";
import { useShareImage } from "@/hooks/use-share-image";
import { authClient } from "@/lib/auth-client";
import { isRemoteImage, uploadChatImage } from "@/lib/cloudinary";
import { errorToast } from "@/utils/toast";
import { queryClient, trpc } from "@/utils/trpc";
import ATTACH_FILE_ICON from "@expo/material-symbols/attach_file.xml";
import MEMBERS_ICON from "@expo/material-symbols/group.xml";
import INFO_ICON from "@expo/material-symbols/info.xml";
import MORE_HORIZ_ICON from "@expo/material-symbols/more_horiz.xml";
import type {
  ChatAttachment,
  ChatMessageItem,
} from "@kosh-app/api/routers/chat";
import {
  buildChatEntries,
  toggleReactionLocal,
  type ChatListEntry,
  type MessagePatch,
  type PendingMessage,
} from "@kosh-app/utils";
import { LegendList } from "@legendapp/list/react-native";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";

const POLL_INTERVAL_MS = 3000;
const HISTORY_PAGE_SIZE = 30;
const RECENT_PAGE_SIZE = 50;
const RECONCILE_TIMEOUT_MS = 10_000;

const ChatThreadScreen = () => {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const router = useRouter();

  const { data: session } = authClient.useSession();
  const myUserId = session?.user.id ?? "";
  const me = session?.user;

  const [draft, setDraft] = useState("");
  const [uploading, setUploading] = useState(false);
  const [target, setTarget] = useState<ComposerTarget | null>(null);
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [actionMessageId, setActionMessageId] = useState<string | null>(null);
  // In-flight optimistic edits to confirmed messages, keyed by message id.
  // Cleared when the mutation settles - success or failure - so the polled
  // server rows are always the final word.
  const [patches, setPatches] = useState<Map<string, MessagePatch>>(
    () => new Map(),
  );

  const headerQuery = useQuery(
    trpc.chat.getThread.queryOptions({ threadId }, { enabled: !!threadId }),
  );

  const historyQuery = useInfiniteQuery(
    trpc.chat.messages.infiniteQueryOptions(
      { threadId, limit: HISTORY_PAGE_SIZE },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );

  // The polled tail. Kept as a separate query from history so that a 3s poll
  // never re-renders the whole backlog.
  const recentQuery = useQuery({
    ...trpc.chat.recent.queryOptions({ threadId, limit: RECENT_PAGE_SIZE }),
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
  });

  const history = useMemo(
    () => historyQuery.data?.pages.flatMap((page) => page.items ?? []) ?? [],
    [historyQuery.data?.pages],
  );
  const recent = useMemo(() => recentQuery.data ?? [], [recentQuery.data]);

  const isGroup = headerQuery.data?.type === "group";

  const messagesById = useMemo(() => {
    const map = new Map<string, ChatMessageItem>();
    for (const message of [...history, ...recent]) map.set(message.id, message);
    for (const item of pending) {
      map.set(`pending:${item.clientId}`, item.message);
    }
    return map;
  }, [history, recent, pending]);

  const actionMessage = actionMessageId
    ? (messagesById.get(actionMessageId) ?? null)
    : null;
  const isActionPending = actionMessage?.id.startsWith("pending:") ?? false;
  // A soft-deleted message is a tombstone. The rows are already inert to
  // long-press, but the id can also be left over from a message that got
  // deleted while its sheet was open, so `visible` is gated on it too.
  //
  // The optimistic half reads `deletedAt` off the patch, not the patch's mere
  // existence. That map also carries reaction patches, and treating any patch
  // as a deletion made a live message look like a tombstone for as long as a
  // reaction was in flight - which closed the sheet the instant you reacted.
  const actionPatch = actionMessage ? patches.get(actionMessage.id) : undefined;
  const isActionDeleted =
    actionMessage?.deletedAt != null || actionPatch?.deletedAt != null;

  /**
   * Whether the open thread's action sheet is pointed at the current user's own
   * message. Derived from the sender in the transcript rather than trusted from
   * the row, so it cannot be spoofed by a stale or optimistic row - the server
   * re-checks ownership regardless.
   */
  const isOwnMessage = actionMessage?.senderId === myUserId;

  /**
   * Share target. `useShareImage` binds the URL when the hook is called, so the
   * URL has to live in state and the share is kicked off from an effect once
   * the hook has picked it up - calling `shareImage` in the same tick as
   * `setShareUrl` would run it against the previous render's URL.
   */
  const [shareUrl, setShareUrl] = useState<string | undefined>(undefined);
  const { downloadImage: shareImage } = useShareImage(shareUrl);

  useEffect(() => {
    if (!shareUrl) return;
    shareImage();
    setShareUrl(undefined);
  }, [shareUrl, shareImage]);

  const entries = useMemo(
    () =>
      buildChatEntries(history, recent, pending, patches, {
        isGroup,
        myUserId,
      }),
    [history, recent, pending, patches, isGroup, myUserId],
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
   * Reads the authoritative rows back for the open thread. Resolves once the
   * refetch has landed, which is what makes it safe to clear a patch straight
   * after awaiting this - otherwise a success would briefly snap the row back
   * to its pre-mutation state while the refetch was still in flight.
   */
  const refetchThread = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: trpc.chat.recent.queryKey({ threadId }),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.chat.messages.queryKey({ threadId }),
      }),
    ]);
  }, [queryClient, threadId]);

  const invalidateThreads = useCallback(() => {
    // Prefix match, so every page of the list is dropped. The badge has its own
    // query and does not read the list, so it has to be invalidated separately.
    void queryClient.invalidateQueries({
      queryKey: trpc.chat.listThreads.queryKey(),
    });
    void queryClient.invalidateQueries({
      queryKey: trpc.chat.unreadTotal.queryKey(),
    });
  }, []);

  /**
   * Clear the unread badge on open and whenever a poll brings in something from
   * someone else, so it does not linger while the thread is on screen.
   */
  const markReadMutation = useMutation(
    trpc.chat.markRead.mutationOptions({ onSuccess: invalidateThreads }),
  );
  const markRead = markReadMutation.mutate;
  const lastReadMessageId = useRef<string | null>(null);

  useEffect(() => {
    if (!threadId || !myUserId) return;
    const newest = recent[recent.length - 1];
    if (!newest || newest.senderId === myUserId) return;
    if (lastReadMessageId.current === newest.id) return;
    lastReadMessageId.current = newest.id;
    markRead({ threadId });
  }, [recent, myUserId, threadId, markRead]);

  const sendMutation = useMutation(
    trpc.chat.send.mutationOptions({
      onError: (error, variables) => {
        // Keep the bubble on screen as a retryable failure rather than
        // discarding what the user typed.
        setPending((current) =>
          current.map((item) =>
            item.clientId === variables.clientId
              ? { ...item, state: "failed" as const }
              : item,
          ),
        );
        errorToast({ title: error.message || "Failed to send message" });
      },
      onSuccess: (_data, variables) => {
        // Deliberately NOT removed here. The confirmed copy only exists once a
        // refetch returns it, and `recent` polls on a 3s interval. Dropping the
        // pending entry on success therefore leaves a window where the message
        // is in neither list and the bubble visibly disappears and reappears.
        // `buildChatEntries` already hides a pending entry as soon as a message
        // with the same clientId shows up, so keeping it hands over seamlessly.
        setPending((current) =>
          current.map((item) =>
            item.clientId === variables.clientId
              ? { ...item, state: "sent" as const }
              : item,
          ),
        );
        invalidateThreads();
        // Pull the confirmed row now rather than waiting out the poll, so the
        // handover is one round trip instead of up to three seconds.
        void queryClient.invalidateQueries({
          queryKey: trpc.chat.recent.queryKey({ threadId }),
        });
        void queryClient.invalidateQueries({
          queryKey: trpc.chat.messages.queryKey({ threadId }),
        });
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
      onError: (error) =>
        errorToast({ title: error.message || "Failed to edit message" }),
    }),
  );

  const deleteMutation = useMutation(
    trpc.chat.deleteMessage.mutationOptions({
      onMutate: ({ messageId }) => {
        setPatches((current) => {
          const next = new Map(current);
          next.set(messageId, {
            ...next.get(messageId),
            // The tombstone also drops the reactions, matching the server,
            // which deletes the reaction rows with the message.
            reactions: [],
            content: null,
            attachments: null,
            deletedAt: new Date().toISOString(),
          });
          return next;
        });
      },
      onSuccess: async (_, { messageId }) => {
        await refetchThread();
        clearPatch(messageId);
        invalidateThreads();
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
  const handleReact = useCallback(
    (emoji: string) => {
      const message = actionMessage;
      if (!message || !myUserId) return;

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
    [actionMessage, myUserId, reactionMutation],
  );

  const handleSend = useCallback(() => {
    const content = draft.trim();
    if (!content || !myUserId || !threadId) return;

    const clientId = `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const replied = target?.message ?? null;

    const optimistic: ChatMessageItem = {
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
            deletedAt: replied.deletedAt,
          }
        : null,
      reactions: [],
    };

    setPending((current) => [
      ...current,
      { clientId, state: "sending", message: optimistic },
    ]);

    setDraft("");
    setTarget(null);

    sendMutation.mutate({
      threadId,
      clientId,
      content,
      replyToId: replied?.id ?? null,
    });
  }, [draft, myUserId, threadId, target, me, sendMutation]);

  /**
   * Upload a local image and send it, driving the existing placeholder through
   * `uploading` -> `sending` -> (reconciled | `failed`).
   *
   * Shared by the initial send and by retry, so a retry is genuinely the same
   * path re-run from the on-device file rather than a second, subtly different
   * code path. The `clientId` is passed in and reused across attempts, which
   * also makes the retry idempotent server-side.
   */
  const sendImage = useCallback(
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
        setPending((current) =>
          current.map((item) =>
            item.clientId === clientId
              ? { ...item, state: "failed" as const }
              : item,
          ),
        );
        errorToast({
          title: error instanceof Error ? error.message : "Upload failed",
        });
      } finally {
        setUploading(false);
      }
    },
    [threadId, sendMutation],
  );

  const handlePickImage = useCallback(async () => {
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
    const clientId = `i-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const name = asset.fileName ?? "Photo";
    const mimeType = asset.mimeType;

    // The bubble goes up immediately, rendering the local file, so the tap is
    // acknowledged straight away rather than after a multi-second upload.
    setPending((current) => [
      ...current,
      {
        clientId,
        state: "uploading" as const,
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
      },
    ]);

    await sendImage(clientId, asset.uri, name, mimeType);
  }, [uploading, threadId, myUserId, me, sendImage]);

  const handleConfirmEdit = useCallback(
    (content: string) => {
      if (target?.mode !== "edit") return;
      editMutation.mutate(
        { messageId: target.message.id, content },
        {
          onSuccess: () => {
            setTarget(null);
            setDraft("");
          },
        },
      );
    },
    [target, editMutation],
  );

  const handleAction = useCallback(
    (action: MessageAction) => {
      const message = actionMessageId
        ? messagesById.get(actionMessageId)
        : null;
      if (!message) return;

      switch (action) {
        case "reply":
          setTarget({ mode: "reply", message });
          return;
        case "edit":
          setDraft(message.content ?? "");
          setTarget({ mode: "edit", message });
          return;
        case "delete":
          deleteMutation.mutate({ messageId: message.id });
          return;
        case "share": {
          const url = message.attachments?.[0]?.url;
          // Only a confirmed, remote image can be shared: a pending bubble holds
          // a local file URI, and `File.downloadFileAsync` needs an http(s) one.
          if (!isRemoteImage(url)) return;
          setShareUrl(url);
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
            void sendImage(
              clientId,
              item.localUri,
              item.message.attachments?.[0]?.name ?? "Photo",
              item.message.attachments?.[0]?.mimeType,
            );
            return;
          }

          // Nothing local to retry from (a text send), so drop the failed
          // placeholder rather than leaving a permanently dead bubble.
          setPending((current) =>
            current.filter((p) => p.clientId !== clientId),
          );
          return;
        }
      }
    },
    [actionMessageId, messagesById, deleteMutation, pending, sendImage],
  );

  const handleStartReached = useCallback(() => {
    if (historyQuery.isFetchingNextPage) return;
    if (historyQuery.hasNextPage) void historyQuery.fetchNextPage();
  }, [historyQuery]);

  const openActions = useCallback((messageId: string) => {
    setActionMessageId(messageId);
  }, []);

  const keyExtractor = useCallback((item: ChatListEntry) => item.key, []);
  const getItemType = useCallback((item: ChatListEntry) => item.kind, []);

  const renderItem = useCallback(
    ({ item }: { item: ChatListEntry }) => {
      if (item.kind === "date") return <DateSeparator entry={item} />;
      return (
        <MessageRow
          entry={item}
          myUserId={myUserId}
          onLongPress={openActions}
          onPressImage={handleOpenImage}
        />
      );
    },
    [myUserId, openActions],
  );

  const ListEmpty = useMemo(() => {
    if (historyQuery.isPending) {
      return (
        <View className="py-10 items-center justify-center">
          <ActivityIndicator />
        </View>
      );
    }
    return (
      <View className="py-16 px-8 items-center justify-center">
        <ThemedText className="text-muted-foreground text-sm text-center">
          No messages yet. Say hello.
        </ThemedText>
      </View>
    );
  }, [historyQuery.isPending]);

  const ListFooter = useMemo(
    () =>
      historyQuery.isFetchingNextPage ? (
        <View className="py-4 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : null,
    [historyQuery.isFetchingNextPage],
  );

  const handleRefresh = useCallback(() => {
    void historyQuery.refetch();
    void recentQuery.refetch();
  }, [historyQuery, recentQuery]);

  // Tapping an attachment hands off to the shared full-screen viewer, which
  // already handles pinch / pan / double-tap. Long-press never reaches here:
  // React Native suppresses `onPress` once `onLongPress` has fired, so a
  // long-press opens the actions sheet instead of navigating away.
  const handleOpenImage = useCallback(
    (url: string) => {
      router.push({ pathname: "/view/[image]", params: { image: url } });
    },
    [router],
  );

  if (historyQuery.isError) {
    return (
      <ErrorComponent
        refetch={handleRefresh}
        message={historyQuery.error?.message ?? "Failed to load messages."}
      />
    );
  }

  return (
    <>
      <Stack.Title>
        {headerQuery.isPending
          ? "Loading..."
          : (headerQuery.data?.title ?? "Chat messages")}
      </Stack.Title>
      {isGroup && (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Menu>
            <Stack.Toolbar.Icon sf="ellipsis.circle" src={MORE_HORIZ_ICON} />

            <Stack.Toolbar.MenuAction
              icon={INFO_ICON}
              onPress={() => {
                router.push({
                  pathname: "/kosh/[id]",
                  params: {
                    id: headerQuery.data?.koshId ?? "",
                  },
                });
              }}
            >
              Kosh details
            </Stack.Toolbar.MenuAction>
            <Stack.Toolbar.MenuAction
              icon={MEMBERS_ICON}
              onPress={() => {
                router.push({
                  pathname: "/chat/[threadId]/members",
                  params: {
                    threadId: threadId ?? "",
                    koshId: headerQuery.data?.koshId ?? "",
                  },
                });
              }}
            >
              Members
            </Stack.Toolbar.MenuAction>
            <Stack.Toolbar.MenuAction
              icon={ATTACH_FILE_ICON}
              onPress={() => {
                router.push({
                  pathname: "/chat/[threadId]/attachments",
                  params: {
                    threadId: threadId ?? "",
                  },
                });
              }}
            >
              Attachments
            </Stack.Toolbar.MenuAction>
          </Stack.Toolbar.Menu>
        </Stack.Toolbar>
      )}

      <LegendList
        // Not inverted. The transcript is held oldest-first and sits at the
        // newest message via `initialScrollAtEnd` + `maintainScrollAtEnd`.
        // Inverting would additionally make `onStartReached` mean "newer".
        data={entries}
        recycleItems
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        renderItem={renderItem}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        initialScrollAtEnd
        maintainScrollAtEnd
        // Chat is append-at-the-end, so keeping the viewport still while the
        // data array identity changes is what stops messages jumping.
        maintainVisibleContentPosition={{ data: true, size: true }}
        onStartReached={handleStartReached}
        onStartReachedThreshold={0.3}
        onRefresh={handleRefresh}
        refreshing={historyQuery.isRefetching}
        contentContainerClassName="py-3"
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />

      <MessageActionsSheet
        visible={actionMessage !== null && !isActionDeleted}
        isFailed={isActionPending}
        canReply={!isActionPending && !isActionDeleted}
        canReact={!isActionPending && !isActionDeleted}
        // Sharing reads the image off the CDN, so it needs a confirmed message
        // with a remote URL. A pending bubble only has a local file URI, which
        // the share sheet's download step cannot fetch.
        canShare={
          !isActionPending &&
          !isActionDeleted &&
          actionMessage?.type === "image" &&
          isRemoteImage(actionMessage?.attachments?.[0]?.url)
        }
        // Edit and delete are author-only. The server enforces this in
        // `requireOwnMessage`, so gating here keeps the sheet from ever
        // offering an action that would come back FORBIDDEN. `isOwnMessage`
        // also folds in the optimistic patch, since a just-deleted message
        // reads as a tombstone before the server confirms.
        canDelete={!isActionPending && !isActionDeleted && isOwnMessage}
        canEdit={
          !isActionPending &&
          !isActionDeleted &&
          isOwnMessage &&
          actionMessage?.type === "text"
        }
        onClose={() => setActionMessageId(null)}
        onReact={handleReact}
        onAction={handleAction}
      />

      <KeyboardStickyView>
        <ChatComposer
          value={draft}
          onChangeText={setDraft}
          onSend={handleSend}
          onPickImage={handlePickImage}
          uploading={uploading}
          target={target}
          onCancelTarget={() => {
            setTarget(null);
            if (target?.mode === "edit") setDraft("");
          }}
          onConfirmEdit={handleConfirmEdit}
        />
      </KeyboardStickyView>
    </>
  );
};

export default ChatThreadScreen;
