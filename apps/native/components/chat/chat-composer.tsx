import { useCallback } from "react";
import { TextInput, View } from "react-native";

import PHOTO_ICON from "@expo/material-symbols/add_photo_alternate.xml";
import SEND_ICON from "@expo/material-symbols/arrow_upward_alt.xml";
import CHECK_ICON from "@expo/material-symbols/check.xml";

import {
  CircularProgressIndicator,
  FilledIconButton,
  Icon,
  IconButton,
} from "@expo/ui/jetpack-compose";
import { size } from "@expo/ui/jetpack-compose/modifiers";
import type { ChatMessageItem } from "@kosh-app/api/routers/chat";
import { Host } from "../layout/host";

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
    <View className="bg-background pt-2">
      {target && <TargetBanner target={target} onCancel={onCancelTarget} />}
      <View className="flex-row items-center px-3">
        <View className="flex-1 flex-row items-center bg-surface rounded-3xl">
          <Host matchContents>
            <IconButton onClick={onPickImage} enabled={!uploading}>
              {uploading ? (
                <CircularProgressIndicator
                  modifiers={[size(20, 20)]}
                  strokeWidth={2}
                />
              ) : (
                <Icon source={PHOTO_ICON} />
              )}
            </IconButton>
          </Host>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder="Your message"
            className="flex-1 text-foreground"
            multiline
          />
        </View>
        <Host matchContents>
          <FilledIconButton onClick={handlePrimary} enabled={canSend}>
            <Icon source={target?.mode === "edit" ? CHECK_ICON : SEND_ICON} />
          </FilledIconButton>
        </Host>
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

  return <View></View>;

  // return (
  //   <View className="flex-row items-center gap-2 px-3 pt-2">
  //     <View className="flex-1 rounded-lg border-l-2 border-primary bg-surface-secondary px-2 py-1.5">
  //       <ThemedText className="text-primary text-[11px] font-notosans-semibold">
  //         {mode === "edit"
  //           ? "Editing message"
  //           : `Replying to ${message.sender.name}`}
  //       </ThemedText>
  //       <ThemedText
  //         numberOfLines={1}
  //         className="text-muted-foreground text-[11px]"
  //       >
  //         {quoted}
  //       </ThemedText>
  //     </View>

  //     <Pressable
  //       onPress={onCancel}
  //       hitSlop={8}
  //       accessibilityRole="button"
  //       accessibilityLabel={mode === "edit" ? "Cancel editing" : "Cancel reply"}
  //       className="p-1"
  //     >
  //       <StyledSymbolView size={16} name={{ ios: "xmark", android: "close" }} />
  //     </Pressable>
  //   </View>
  // );
}
