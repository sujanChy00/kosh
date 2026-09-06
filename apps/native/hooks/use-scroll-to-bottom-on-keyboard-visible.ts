import { useEffect, useRef } from "react";
import { ScrollView } from "react-native";
import { useKeyboard } from "./use-keyboard";

export const useScrollToBottomOnKeyboardVisible = () => {
  const { isKeyboardVisible } = useKeyboard();
  const scrollViewRef = useRef<ScrollView>(null);
  useEffect(() => {
    if (!scrollViewRef.current) return;
    if (isKeyboardVisible) {
      const timeout = setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [isKeyboardVisible]);

  return { scrollViewRef };
};
