import { StyledSymbolView } from "@/components/styled-symbol-view";
import { ThemedText } from "@/components/themed-text";
import { Modal, Pressable, View } from "react-native";

import { QUICK_REACTIONS } from "@kosh-app/utils";

export type MessageAction = "reply" | "edit" | "delete" | "retry" | "share";

export type MessageActionsSheetProps = {
  visible: boolean;
  canEdit: boolean;
  canReply: boolean;
  canReact: boolean;
  canDelete: boolean;
  canShare: boolean;
  isFailed: boolean;
  onClose: () => void;
  onReact: (emoji: string) => void;
  onAction: (action: MessageAction) => void;
};

/**
 * Long-press actions for a message.
 *
 * Every action is gated by an explicit `can*` prop rather than being derived
 * here, so the sheet can only ever offer something the server will accept. A
 * soft-deleted message is the case that motivated that: it is a tombstone, and
 * reacting to, editing or deleting it all fail with "This message was deleted".
 * Rendering those rows anyway produces a dead-end menu.
 *
 * Mounted once at screen level and driven by a message id held in screen state,
 * rather than once per row. That is deliberate: with `recycleItems` a row can be
 * handed a different message while its own sheet is open, and per-row sheet
 * state would then end up attached to the wrong message.
 */
export const MessageActionsSheet = ({
  visible,
  canEdit,
  canReply,
  canReact,
  canDelete,
  canShare,
  isFailed,
  onClose,
  onReact,
  onAction,
}: MessageActionsSheetProps) => {
  const run = (fn: () => void) => () => {
    onClose();
    fn();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Dismiss message actions"
        className="flex-1 items-center justify-center bg-black/40 px-6"
      >
        {/* Swallow taps so pressing inside the sheet does not dismiss it. */}
        <Pressable onPress={() => {}} className="w-full max-w-sm">
          <View className="bg-background rounded-2xl overflow-hidden border-hairline">
            {canReact && (
              <View className="flex-row justify-center gap-1 py-3">
                {QUICK_REACTIONS.map((emoji) => (
                  <Pressable
                    key={emoji}
                    onPress={run(() => onReact(emoji))}
                    accessibilityRole="button"
                    accessibilityLabel={`React with ${emoji}`}
                    className="size-11 rounded-full items-center justify-center active:bg-surface-secondary"
                  >
                    <ThemedText className="text-2xl">{emoji}</ThemedText>
                  </Pressable>
                ))}
              </View>
            )}

            {canReact && <View className="h-hairline bg-separator" />}

            {isFailed ? (
              <SheetRow
                label="Try sending again"
                icon="refresh"
                onPress={run(() => onAction("retry"))}
              />
            ) : (
              <>
                {canReply && (
                  <SheetRow
                    label="Reply"
                    icon="reply"
                    onPress={run(() => onAction("reply"))}
                  />
                )}
                {canShare && (
                  <SheetRow
                    label="Share"
                    icon="share"
                    onPress={run(() => onAction("share"))}
                  />
                )}
                {canEdit && (
                  <SheetRow
                    label="Edit"
                    icon="edit"
                    onPress={run(() => onAction("edit"))}
                  />
                )}
                {canDelete && (
                  <SheetRow
                    label="Delete"
                    icon="delete"
                    destructive
                    onPress={run(() => onAction("delete"))}
                  />
                )}
              </>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const ICONS = {
  delete: { ios: "trash", android: "delete" },
  edit: { ios: "pencil", android: "edit" },
  reply: { ios: "arrowshape.turn.up.left", android: "reply" },
  refresh: { ios: "arrow.clockwise", android: "refresh" },
  share: { ios: "square.and.arrow.up", android: "share" },
} as const;

function SheetRow({
  label,
  icon,
  destructive,
  onPress,
}: {
  label: string;
  icon: keyof typeof ICONS;
  destructive?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="active:bg-surface-secondary"
    >
      <View className="flex-row items-center gap-3 px-4 py-3.5">
        <StyledSymbolView
          size={18}
          tintColorClassName={
            destructive ? "text-danger" : "text-muted-foreground"
          }
          name={ICONS[icon]}
        />
        <ThemedText
          className={
            destructive
              ? "text-danger text-[15px] font-notosans-medium"
              : "text-foreground text-[15px]"
          }
        >
          {label}
        </ThemedText>
      </View>
    </Pressable>
  );
}
