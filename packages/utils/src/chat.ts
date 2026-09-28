import type { ChatMessageItem } from "@kosh-app/api/routers/chat";
import { isRemoteImage } from "./url";

/**
 * Long-press actions offered on a message. Domain, not UI: the sheet that
 * renders these and the hook that dispatches them both need the union, and
 * neither should have to import the other.
 */
export type MessageAction = "reply" | "edit" | "delete" | "retry" | "share";

/**
 * Client-minted id for an optimistic send, reused across retry so a retry is
 * idempotent server-side. The prefix is only a debugging aid; uniqueness comes
 * from the timestamp plus random suffix.
 */
export function createMessageClientId(kind: "text" | "image" = "text") {
  const prefix = kind === "image" ? "i" : "c";
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Whether a message can be handed to the system share sheet.
 *
 * Both halves matter and are easy to get wrong separately: the image has to be
 * a confirmed row (a pending bubble holds an on-device `file://` URI) and its
 * first attachment has to already be an http(s) URL, because sharing downloads
 * the image first and cannot read a local file.
 */
export function isShareableImage(
  message?: {
    type: ChatMessageItem["type"];
    attachments?: ChatMessageItem["attachments"] | null;
  } | null,
): boolean {
  return (
    message?.type === "image" && isRemoteImage(message.attachments?.[0]?.url)
  );
}

/** Locally-owned optimistic row, before the server has confirmed it. */
export type PendingMessage = {
  clientId: string;
  message: ChatMessageItem;
  /**
   * `sent` is the important third state: the server has accepted the row, but
   * the confirmed copy has not landed in `history`/`recent` yet. The entry has
   * to be kept until then, because dropping it early leaves a window where the
   * message is in neither list and the bubble blinks out of existence.
   *
   * `uploading` is image-only: the bubble is on screen showing the local file
   * while Cloudinary is still being called, so the tap is acknowledged at once
   * rather than after a multi-second round trip.
   */
  state: "uploading" | "sending" | "sent" | "failed";
  /**
   * The original on-device file for an image, kept so a failed send can be
   * retried without making the user pick the photo again.
   *
   * Held separately from `message.attachments` because that gets repointed at
   * the CDN URL the moment the upload succeeds - so a failure in the *send*
   * step would otherwise have no local source left to retry from.
   */
  localUri?: string;
};

export type ChatListEntry =
  | {
      kind: "date";
      key: string;
      /** Midnight-anchored ISO instant for the day this separator introduces. */
      dayStart: string;
    }
  | {
      kind: "message";
      key: string;
      message: ChatMessageItem;
      /**
       * Precomputed so a row never has to inspect its neighbours. With
       * `recycleItems` a row is reused for a different item, so "am I the last
       * of a run?" cannot be answered from position at render time.
       */
      showSender: boolean;
      delivery?: "uploading" | "sending" | "sent" | "failed";
    };

export function dayStartOf(iso: string) {
  const date = new Date(iso);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function compareByCreatedAt(a: ChatMessageItem, b: ChatMessageItem) {
  const delta =
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  if (delta !== 0) return delta;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * A pending local edit to a confirmed message, applied on top of the server
 * rows so a reaction tap or a delete lands on the next frame instead of after a
 * round trip plus a poll. Held in the same style as `PendingMessage`: the patch
 * is dropped as soon as the mutation settles, leaving the polled query as the
 * only source of truth.
 */
export type MessagePatch = {
  reactions?: ChatMessageItem["reactions"];
  deletedAt?: string | null;
  content?: string | null;
  attachments?: ChatMessageItem["attachments"];
  /** Cleared alongside the content: a tombstone does not keep its quote. */
  replyTo?: ChatMessageItem["replyTo"];
};

/**
 * Mirrors the server's add-if-absent / remove-if-present toggle so the chip
 * animates to the same end state the database will land on. Empty buckets are
 * dropped entirely, otherwise un-reacting the last person would leave a "0"
 * chip behind.
 */
export function toggleReactionLocal(
  reactions: ChatMessageItem["reactions"],
  emoji: string,
  myUserId: string,
): ChatMessageItem["reactions"] {
  const existing = reactions.find((r) => r.emoji === emoji);

  if (!existing) {
    return [...reactions, { emoji, userIds: [myUserId] }];
  }

  const userIds = existing.userIds.includes(myUserId)
    ? existing.userIds.filter((id) => id !== myUserId)
    : [...existing.userIds, myUserId];

  return reactions
    .map((r) => (r.emoji === emoji ? { ...r, userIds } : r))
    .filter((r) => r.userIds.length > 0);
}

/**
 * Folds the two query sources into one oldest-first transcript and inserts the
 * day separators.
 *
 * `history` is the keyset-paginated backlog and `recent` is the polled tail;
 * they overlap once enough messages have accumulated, so entries are deduped
 * by id. A pending row is dropped as soon as a server message carrying the same
 * `clientId` shows up, which is what lets optimistic sends coexist with polling
 * without ever showing the same message twice.
 */
export function buildChatEntries(
  history: readonly ChatMessageItem[],
  recent: readonly ChatMessageItem[],
  pending: readonly PendingMessage[],
  patches: ReadonlyMap<string, MessagePatch>,
  opts: { isGroup: boolean; myUserId: string },
): ChatListEntry[] {
  const byId = new Map<string, ChatMessageItem>();
  for (const message of history) byId.set(message.id, message);
  for (const message of recent) byId.set(message.id, message);

  // Applied after the merge so one patch covers a message regardless of which
  // query it arrived in.
  for (const [id, patch] of patches) {
    const base = byId.get(id);
    if (base) byId.set(id, { ...base, ...patch });
  }

  // A reply carries its target as a snapshot read at the time the reply was
  // fetched, so a tombstone applied to the target is invisible to the reply
  // until the refetch lands. Propagate it here: otherwise a deleted message
  // shows its own tombstone directly above a reply that still quotes its full
  // text, for the length of a round trip.
  //
  // Nulling `content` to match the server's own delete behaviour - the text is
  // gone from the database too, so keeping it in the quote would resurrect it.
  for (const message of byId.values()) {
    const reply = message.replyTo;
    if (!reply || reply.deletedAt) continue;

    const targetPatch = patches.get(reply.id);
    if (!targetPatch?.deletedAt) continue;

    byId.set(message.id, {
      ...message,
      replyTo: { ...reply, content: null, deletedAt: targetPatch.deletedAt },
    });
  }

  const confirmedClientIds = new Set<string>();
  for (const message of byId.values()) {
    if (message.clientId) confirmedClientIds.add(message.clientId);
  }

  const ordered = [...byId.values()].sort(compareByCreatedAt);

  const unresolved = pending
    .filter((p) => !confirmedClientIds.has(p.clientId))
    .map<ChatMessageItem>((p) => ({
      ...p.message,
      id: `pending:${p.clientId}`,
    }))
    .sort(compareByCreatedAt);

  const stateBySyntheticId = new Map<string, PendingMessage["state"]>();
  for (const item of pending) {
    stateBySyntheticId.set(`pending:${item.clientId}`, item.state);
  }

  const all = [...ordered, ...unresolved];

  const entries: ChatListEntry[] = [];
  let currentDay: number | null = null;
  let previous: ChatMessageItem | null = null;

  for (const message of all) {
    const day = dayStartOf(message.createdAt);

    if (day !== currentDay) {
      currentDay = day;
      entries.push({
        kind: "date",
        key: `date:${day}`,
        dayStart: new Date(day).toISOString(),
      });
      previous = null;
    }

    // In a group chat, show the sender line on the first message of a run by
    // the same person within a few minutes. In a DM it is always obvious who
    // is talking, so the line is suppressed entirely.
    const showSender =
      opts.isGroup &&
      (previous === null ||
        previous.senderId !== message.senderId ||
        new Date(message.createdAt).getTime() -
          new Date(previous.createdAt).getTime() >
          5 * 60 * 1000);

    entries.push({
      kind: "message",
      key: message.id,
      message,
      showSender,
      delivery: stateBySyntheticId.get(message.id),
    });

    previous = message;
  }

  return entries;
}

/**
 * Identity comparison for the message list.
 *
 * `recent` is refetched every few seconds, and each response is a fresh set of
 * objects. Without this, every poll would re-render every mounted bubble; with
 * it, only rows whose content actually changed do any work.
 *
 * This must cover every field the row renders - content, media, edit/deletion
 * state, the reply quote, reactions, sender, and delivery status - or stale
 * output survives a poll.
 */
export function chatEntrySignature(entry: ChatListEntry): string {
  if (entry.kind === "date") return `date:${entry.dayStart}`;

  const { message: m, showSender, delivery } = entry;
  const reactions = m.reactions
    .map((r) => `${r.emoji}>${[...r.userIds].sort().join(",")}`)
    .sort()
    .join("|");
  const reply = m.replyTo
    ? `${m.replyTo.id}>${m.replyTo.content ?? ""}>${m.replyTo.deletedAt ?? ""}`
    : "-";

  return [
    m.id,
    m.type,
    m.content ?? "",
    m.editedAt ?? "",
    m.deletedAt ?? "",
    m.senderId,
    m.sender.name,
    JSON.stringify(m.attachments ?? null),
    reply,
    reactions,
    showSender ? "1" : "0",
    delivery ?? "-",
  ].join("");
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** "2:45 PM" */
export function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Compact stamp for the thread list: time today, "Yesterday", else a date. */
export function formatThreadStamp(iso: string | null) {
  if (!iso) return "";
  const time = new Date(iso).getTime();
  const today = startOfToday();

  if (time >= today) return formatMessageTime(iso);
  if (time >= today - DAY) return "Yesterday";
  if (time >= today - 7 * DAY) {
    return new Date(iso).toLocaleDateString(undefined, { weekday: "short" });
  }
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

/** Sticky-ish separator text: "Today", "Yesterday", else a full date. */
export function formatDayLabel(dayStartIso: string) {
  const time = new Date(dayStartIso).getTime();
  const today = startOfToday();

  if (time === today) return "Today";
  if (time === today - DAY) return "Yesterday";
  return new Date(dayStartIso).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function formatBytes(bytes?: number) {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Quick-reply emoji offered by the long-press reaction bar. */
export const QUICK_REACTIONS = ["👍", "❤️", "😂", "🙏", "👌", "🔥"] as const;
