import { ComponentRef, forwardRef } from "react";
import type { ScrollViewProps } from "react-native";
import { KeyboardChatScrollView } from "react-native-keyboard-controller";

type ScrollViewRef = ComponentRef<typeof KeyboardChatScrollView>;

export const VirtualizedListScrollView = forwardRef<
  ScrollViewRef,
  ScrollViewProps
>((props, ref) => {
  return (
    <KeyboardChatScrollView
      ref={ref}
      {...props}
      automaticallyAdjustContentInsets={false}
      contentInsetAdjustmentBehavior="never"
      keyboardLiftBehavior="whenAtEnd"
    />
  );
});

VirtualizedListScrollView.displayName = "VirtualizedListScrollView";
