import { ChatComposer } from "@/components/chat/chat-composer";
import { useChatComposerContext } from "@/contexts/chat-thread-context";
import { KeyboardStickyView } from "react-native-keyboard-controller";

/**
 * The input, lifted above the keyboard so it tracks the IME.
 *
 * Wrapped rather than inlined in the screen because the sticky view is an
 * implementation detail of the composer, not of the route.
 */
export const ChatThreadComposer = () => {
  const composer = useChatComposerContext();

  return (
    <KeyboardStickyView>
      <ChatComposer
        value={composer.draft}
        onChangeText={composer.setDraft}
        onSend={composer.send}
        onPickImage={composer.pickImage}
        uploading={composer.uploading}
        target={composer.target}
        onCancelTarget={composer.cancelTarget}
        onConfirmEdit={composer.confirmEdit}
      />
    </KeyboardStickyView>
  );
};
