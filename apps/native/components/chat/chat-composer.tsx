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
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { Host } from "../layout/host";
import { ChatReplyTextHolder } from "./chat-reply-text-holder";

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
    <KeyboardStickyView
      offset={{
        closed: -25,
        opened: -10,
      }}
    >
      <View className="bg-background pt-2">
        {target && (
          <ChatReplyTextHolder target={target} onCancel={onCancelTarget} />
        )}
        <View className="flex-row items-center pl-3 pr-2">
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
    </KeyboardStickyView>
  );
};
