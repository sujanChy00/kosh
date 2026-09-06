import { useHaptics } from "@/hooks/use-haptics";
import React, {
  Activity,
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Pressable,
  TextInput,
  TextInputKeyPressEvent,
  TextInputProps,
  View,
} from "react-native";
import { twMerge } from "tailwind-merge";
import { ThemedText } from "../themed-text";

export interface InputOTPProps extends Omit<
  TextInputProps,
  "style" | "value" | "onChangeText"
> {
  /** Number of OTP digits */
  length?: number;
  /** Current OTP value */
  value?: string;
  /** Called when OTP value changes */
  onChangeText?: (value: string) => void;
  /** Called when OTP is complete */
  onComplete?: (value: string) => void;
  /** Error message to display */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Container style */
  /** Whether to mask the input (show dots instead of numbers) */
  masked?: boolean;
  /** Separator component between slots */
  separator?: React.ReactNode;
  /** Whether to show cursor in active slot */
  showCursor?: boolean;
  /** Whether to trigger haptic feedback when the code is complete */
  haptic?: boolean;
}

export interface InputOTPRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  getValue: () => string;
}

export const InputOTP = forwardRef<InputOTPRef, InputOTPProps>(
  (
    {
      length = 6,
      value = "",
      onChangeText,
      onComplete,
      error,
      disabled = false,
      masked = false,
      separator,
      showCursor = true,
      haptic = true,
      onFocus,
      onBlur,
      ...textInputProps
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const feedback = useHaptics(haptic);

    // Normalize value to ensure it doesn't exceed length
    const normalizedValue = value.slice(0, length);

    // Calculate active index based on current value
    const currentActiveIndex = Math.min(normalizedValue.length, length - 1);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: () => {
        onChangeText?.("");
      },
      getValue: () => normalizedValue,
    }));

    const handleChangeText = useCallback(
      (text: string) => {
        // Only allow numeric input
        const cleanText = text.replace(/[^0-9]/g, "");
        const limitedText = cleanText.slice(0, length);

        onChangeText?.(limitedText);

        // Call onComplete when OTP is fully entered.
        // Deliberately the only haptic here: the system keyboard already emits
        // its own key click, so a per-keystroke buzz would double up on the one
        // interaction the user repeats `length` times.
        if (limitedText.length === length) {
          feedback("success");
          onComplete?.(limitedText);
        }
      },
      [length, onChangeText, onComplete, feedback],
    );

    const handleKeyPress = useCallback(
      (e: TextInputKeyPressEvent) => {
        const { key } = e.nativeEvent;

        if (key === "Backspace" && normalizedValue.length > 0) {
          const newValue = normalizedValue.slice(0, -1);
          onChangeText?.(newValue);
        }
      },
      [normalizedValue, onChangeText],
    );

    const handleFocus = useCallback(
      (e: any) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      [normalizedValue.length, onFocus],
    );

    const handleBlur = useCallback(
      (e: any) => {
        setIsFocused(false);
        onBlur?.(e);
      },
      [onBlur],
    );

    const handleSlotPress = useCallback(() => {
      if (disabled) return;

      inputRef.current?.blur();
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }, [disabled]);

    const slots = Array.from({ length }, (_, index) => {
      const hasValue = index < normalizedValue.length;
      const isActive = isFocused && index === currentActiveIndex;
      const displayValue = hasValue
        ? masked
          ? "•"
          : normalizedValue[index]
        : "";

      return (
        <React.Fragment key={index}>
          <Pressable
            onPress={handleSlotPress}
            disabled={disabled}
            accessibilityRole="keyboardkey"
            accessibilityLabel={
              hasValue
                ? `Digit ${index + 1} of ${length}, ${masked ? "filled" : normalizedValue[index]}`
                : `Digit ${index + 1} of ${length}, empty`
            }
            accessibilityState={{ disabled, selected: isActive }}
            className={twMerge(
              "size-10 rounded-sm items-center justify-center border",
              error
                ? "border-danger"
                : isActive
                  ? "border-primary"
                  : "border-foreground",
              disabled && "opacity-60 cursor-not-allowed",
            )}
          >
            <ThemedText
              className={twMerge(
                "text-center font-semibold",
                error ? "text-danger" : "text-foreground",
              )}
            >
              {displayValue}
            </ThemedText>

            {showCursor && isActive && !hasValue && (
              <View
                className="bg-primary"
                style={{
                  position: "absolute",
                  width: 2,
                  height: 20,

                  // backgroundColor: primary,
                  opacity: isFocused ? 1 : 0,
                }}
              />
            )}
          </Pressable>

          {/* Separator */}
          {separator && index < length - 1 && (
            <View style={{ marginHorizontal: 4 }}>{separator}</View>
          )}
        </React.Fragment>
      );
    });

    const renderContent = () => (
      <View className="w-full">
        <TextInput
          ref={inputRef}
          value={normalizedValue}
          onChangeText={handleChangeText}
          onKeyPress={handleKeyPress}
          onFocus={handleFocus}
          onBlur={handleBlur}
          keyboardType="numeric"
          maxLength={length}
          editable={!disabled}
          selectionColor="transparent"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          style={{
            position: "absolute",
            left: -9999,
            opacity: 0,
          }}
          {...textInputProps}
        />

        <View
          className={twMerge(
            "justify-between items-center flex-row",
            separator ? "gap-0" : "gap-2",
          )}
        >
          {slots}
        </View>

        <Activity mode={!!error ? "visible" : "hidden"}>
          <ThemedText className="text-danger text-sm mt-1">{error}</ThemedText>
        </Activity>
      </View>
    );

    return renderContent();
  },
);

InputOTP.displayName = "InputOTP";

// Optional: Export a preset with separator
export const InputOTPWithSeparator = forwardRef<
  InputOTPRef,
  Omit<InputOTPProps, "separator">
>((props, ref) => (
  <InputOTP
    ref={ref}
    separator={
      <ThemedText
      // style={{ fontSize: 18, color: useColor("textMuted") }}
      >
        -
      </ThemedText>
    }
    {...props}
  />
));

InputOTPWithSeparator.displayName = "InputOTPWithSeparator";
