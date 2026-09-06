import { useCallback, useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

interface UseKeyboardHeightReturn {
  isKeyboardVisible: boolean;
  dismissKeyboard: () => void;
}

export const useKeyboard = (): UseKeyboardHeightReturn => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState<boolean>(false);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const dismissKeyboard = useCallback(() => {
    if (isKeyboardVisible) {
      Keyboard.dismiss();
    }
  }, [isKeyboardVisible]);

  return {
    isKeyboardVisible,
    dismissKeyboard,
  };
};
