import { useMessageActionsContext } from "@/contexts/chat-thread-context";
import { cn, QUICK_REACTIONS } from "@kosh-app/utils";
import { SymbolViewProps } from "expo-symbols";
import { Modal, Pressable, TouchableOpacity, View } from "react-native";
import { FadeInDown } from "react-native-reanimated";
import { AnimatedView } from "../animated-view";
import { StyledSymbolView } from "../styled-symbol-view";
import { ThemedText } from "../themed-text";
import { Separator } from "../ui/separator";

export const MessageActionsSheet = () => {
  const {
    onClose,
    canShare,
    canReact,
    canCopy,
    canEdit,
    canDelete,
    isFailed,
    isOpen,
    onAction,
    onReact,
    canReply,
  } = useMessageActionsContext();

  const run = (fn: () => void) => () => {
    onClose();
    fn();
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={isOpen}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        {/* Tapping the dimmed area above the sheet dismisses it - the only
            close affordance a user has on iOS, where there is no back button.
            `absolute inset-0` keeps it out of the `justify-end` flow, and being
            declared before the sheet puts it underneath in paint order, so the
            sheet's own rows win their taps. */}
        <Pressable
          className="absolute inset-0 bg-black/50"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close message actions"
        />
        <AnimatedView entering={FadeInDown} className={"bg-surface pb-8"}>
          {canReact && (
            <View className="flex-row items-center justify-between p-4">
              {QUICK_REACTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={run(() => onReact(emoji))}
                >
                  <ThemedText>{emoji}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {canReact && <Separator />}
          <View
            className={cn(
              "items-center flex-row p-4",
              isFailed
                ? "justify-center"
                : !canShare && !canDelete
                  ? "justify-around"
                  : "justify-between",
            )}
          >
            {isFailed ? (
              <SheetRow
                label="Failed"
                icon={{
                  ios: "arrow.clockwise",
                  android: "refresh",
                }}
                onPress={run(() => onAction("retry"))}
              />
            ) : (
              <>
                {canReply && (
                  <SheetRow
                    label="Reply"
                    icon={{
                      ios: "arrowshape.turn.up.left.2",
                      android: "reply_all",
                    }}
                    onPress={run(() => onAction("reply"))}
                  />
                )}

                {canCopy && (
                  <SheetRow
                    label="Copy"
                    icon={{
                      ios: "doc.on.doc",
                      android: "content_copy",
                    }}
                    onPress={run(() => onAction("copy"))}
                  />
                )}

                {canEdit && (
                  <SheetRow
                    label="Edit"
                    icon={{
                      ios: "pencil",
                      android: "edit",
                    }}
                    onPress={run(() => onAction("edit"))}
                  />
                )}

                {canShare && (
                  <SheetRow
                    label="Share"
                    icon={{
                      ios: "square.and.arrow.up",
                      android: "share",
                    }}
                    onPress={run(() => onAction("share"))}
                  />
                )}

                {canDelete && (
                  <SheetRow
                    label="Delete"
                    icon={{
                      ios: "trash",
                      android: "delete",
                    }}
                    onPress={run(() => onAction("delete"))}
                    destructive
                  />
                )}
              </>
            )}
          </View>
        </AnimatedView>
      </View>
    </Modal>
  );
};

function SheetRow({
  label,
  icon,
  destructive,
  onPress,
}: {
  label: string;
  icon: SymbolViewProps["name"];
  destructive?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={() => {
        onPress();
      }}
    >
      <View className="gap-y-1.5 items-center">
        <StyledSymbolView
          name={icon}
          tintColorClassName={
            destructive ? "accent-danger" : "accent-foreground"
          }
        />
        <ThemedText className={destructive ? "text-danger" : "text-foreground"}>
          {label}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}
