import { StyledSymbolView } from "@/components/styled-symbol-view";
import { ThemedText } from "@/components/themed-text";
import { cn } from "@kosh-app/utils";
import { useCallback } from "react";
import { ActivityIndicator, Pressable, TextInput, View } from "react-native";

import type { ChatMessageItem } from "@kosh-app/api/routers/chat";

export type ComposerTarget =
  | { mode: "reply"; message: ChatMessageItem }
  | { mode: "edit"; message: ChatMessageItem };

export type ChatComposerProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onPickImage: () => void;
  uploading: boolean;
  target: ComposerTarget | null;
  onCancelTarget: () => void;
  onConfirmEdit: (text: string) => void;
};

const MAX_HEIGHT = 120;

export const ChatComposer = ({
  value,
  onChangeText,
  onSend,
  onPickImage,
  uploading,
  target,
  onCancelTarget,
  onConfirmEdit,
}: ChatComposerProps) => {
  const canSend = value.trim().length > 0;

  const handlePrimary = useCallback(() => {
    if (target?.mode === "edit") {
      onConfirmEdit(value.trim());
      return;
    }
    if (canSend) onSend();
  }, [canSend, onConfirmEdit, onSend, target, value]);

  return (
    <View className="border-t-hairline bg-background">
      {target && <TargetBanner target={target} onCancel={onCancelTarget} />}

      <View className="flex-row items-end gap-2 px-3 py-2">
        <Pressable
          onPress={onPickImage}
          disabled={uploading}
          accessibilityRole="button"
          accessibilityLabel="Attach a photo"
          className="size-9 rounded-full items-center justify-center bg-surface-secondary"
        >
          {uploading ? (
            <ActivityIndicator size="small" />
          ) : (
            <StyledSymbolView
              size={18}
              tintColorClassName="text-muted-foreground"
              name={{ ios: "photo.badge.plus", android: "add_photo_alternate" }}
            />
          )}
        </Pressable>

        <View className="flex-1 rounded-3xl bg-surface-secondary px-3 py-2 justify-center">
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={
              target?.mode === "edit" ? "Edit your message" : "Message"
            }
            placeholderTextColor="var(--color-muted-foreground)"
            multiline
            maxLength={4000}
            className="text-foreground text-[15px] font-notosans-regular p-0"
            style={{ maxHeight: MAX_HEIGHT, minHeight: 22 }}
            accessibilityLabel="Message input"
          />
        </View>

        <Pressable
          onPress={handlePrimary}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel={
            target?.mode === "edit" ? "Save edit" : "Send message"
          }
          className={cn(
            "size-9 rounded-full items-center justify-center",
            canSend ? "bg-primary" : "bg-surface-tertiary",
          )}
        >
          <StyledSymbolView
            size={18}
            tintColorClassName={
              canSend ? "text-primary-foreground" : "text-muted-foreground"
            }
            name={
              target?.mode === "edit"
                ? { ios: "checkmark", android: "check" }
                : { ios: "paperplane.fill", android: "send" }
            }
          />
        </Pressable>
      </View>
    </View>
  );
};

function TargetBanner({
  target,
  onCancel,
}: {
  target: ComposerTarget;
  onCancel: () => void;
}) {
  const { message, mode } = target;
  const quoted = message.deletedAt
    ? "Deleted message"
    : (message.content ?? (message.attachments?.length ? "Sent a photo" : ""));

  return (
    <View className="flex-row items-center gap-2 px-3 pt-2">
      <View className="flex-1 rounded-lg border-l-2 border-primary bg-surface-secondary px-2 py-1.5">
        <ThemedText className="text-primary text-[11px] font-notosans-semibold">
          {mode === "edit"
            ? "Editing message"
            : `Replying to ${message.sender.name}`}
        </ThemedText>
        <ThemedText
          numberOfLines={1}
          className="text-muted-foreground text-[11px]"
        >
          {quoted}
        </ThemedText>
      </View>

      <Pressable
        onPress={onCancel}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={mode === "edit" ? "Cancel editing" : "Cancel reply"}
        className="p-1"
      >
        <StyledSymbolView
          size={16}
          tintColorClassName="text-muted-foreground"
          name={{ ios: "xmark", android: "close" }}
        />
      </Pressable>
    </View>
  );
}
