import { useCallback, useEffect, useState } from "react";
import { Keyboard } from "react-native";
import { KeyboardController } from "react-native-keyboard-controller";

interface UseKeyboardReturn {
  isKeyboardVisible: boolean;
  dismissKeyboard: () => Promise<void>;
}

/**
 * Keyboard visibility, read from the library that actually drives the keyboard.
 *
 * This deliberately does NOT use react-native's `Keyboard.addListener`. This app
 * routes the keyboard through `react-native-keyboard-controller` (see the
 * `KeyboardStickyView` in the chat composer), and that library owns the native
 * keyboard event pipeline. RN's own listeners go quiet, so a visibility flag
 * built on them reads `false` forever.
 *
 * That is not a subtle degradation - it makes every `if (isKeyboardVisible)`
 * branch unreachable. All three consumers were dead for that reason: the
 * actions sheet could not dismiss the keyboard before presenting (so it opened
 * underneath the keyboard and appeared to do nothing),
 * `useScrollToBottomOnKeyboardVisible` never scrolled, and `AnimatedSpacer`
 * never grew.
 */
export const useKeyboard = (): UseKeyboardReturn => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () =>
      setIsKeyboardVisible(true),
    );
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () =>
      setIsKeyboardVisible(false),
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const dismissKeyboard = useCallback(() => KeyboardController.dismiss(), []);

  return {
    isKeyboardVisible,
    dismissKeyboard,
  };
};
