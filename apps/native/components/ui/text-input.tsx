import { useCallback, useState } from "react";
import {
  BlurEvent,
  FocusEvent,
  TextInput as NativeTextInput,
  TextInputProps as NativeTextInputProps,
  View,
} from "react-native";
import { twMerge } from "tailwind-merge";
import { tv } from "tailwind-variants";

const container = tv({
  base: "w-full bg-surface shadow rounded-2xl overflow-hidden",
  variants: {
    isDisabled: { true: "opacity-50" },
    isFocused: { true: "ring-2 ring-primary" },
    isInvalid: { true: "ring-2 ring-danger" },
  },
  defaultVariants: { isDisabled: false, isFocused: false, isInvalid: false },
});

export interface TextInputProps extends NativeTextInputProps {
  isInvalid?: boolean;
  containerClassName?: string;
}

export const TextInput = ({
  className,
  containerClassName,
  editable = true,
  isInvalid = false,
  onFocus: onFocusProp,
  onBlur: onBlurProp,
  ...rest
}: TextInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = useCallback(
    (event: FocusEvent) => {
      setIsFocused(true);
      onFocusProp?.(event);
    },
    [onFocusProp],
  );

  const handleBlur = useCallback(
    (event: BlurEvent) => {
      setIsFocused(false);
      onBlurProp?.(event);
    },
    [onBlurProp],
  );

  return (
    <View
      className={container({
        isDisabled: !editable,
        isFocused: isFocused && !isInvalid,
        isInvalid,
        className: containerClassName,
      })}
    >
      <NativeTextInput
        editable={editable}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={twMerge("px-3 py-4 text-foreground", className)}
        {...rest}
      />
    </View>
  );
};
