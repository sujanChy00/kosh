import { Text } from "@expo/ui";
import {
  OutlinedTextField,
  TextFieldRef,
  useNativeState,
} from "@expo/ui/jetpack-compose";
import { fillMaxWidth, weight } from "@expo/ui/jetpack-compose/modifiers";
import { forwardRef, useCallback } from "react";
import { Host } from "../layout/host";

// const container = tv({
//   base: "w-full bg-surface shadow rounded-2xl overflow-hidden",
//   variants: {
//     isDisabled: { true: "opacity-50" },
//     isFocused: { true: "ring-2 ring-primary" },
//     isInvalid: { true: "ring-2 ring-danger" },
//   },
//   defaultVariants: { isDisabled: false, isFocused: false, isInvalid: false },
// });

export interface TextInputProps extends Omit<
  React.ComponentProps<typeof OutlinedTextField>,
  "value" | "onValueChange" | "isError"
> {
  isInvalid?: boolean;
  placeholder?: string;
  label?: string;
  onChangeText?: (text: string) => void;
  value?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  description?: string;
  placeholderProps?: React.ComponentProps<typeof Text>;
}

export const TextInput = forwardRef<TextFieldRef, TextInputProps>(
  (
    {
      isInvalid = false,
      placeholder,
      label,
      onChangeText,
      value,
      prefix,
      suffix,
      description,
      placeholderProps,
      modifiers,
      singleLine = true,
      keyboardOptions,
      ...rest
    },
    ref,
  ) => {
    const text = useNativeState(value ?? "");
    const handleChange = useCallback(
      (textValue: string) => {
        text.value = textValue;
        onChangeText?.(text.value);
      },
      [text, onChangeText],
    );

    return (
      <Host matchContents={{ vertical: true }} style={{ width: "100%" }}>
        <OutlinedTextField
          {...rest}
          ref={ref}
          singleLine={singleLine}
          isError={isInvalid}
          value={text}
          keyboardOptions={{
            capitalization: keyboardOptions?.capitalization ?? "none",
            autoCorrectEnabled: keyboardOptions?.autoCorrectEnabled ?? false,
            ...keyboardOptions,
          }}
          modifiers={[weight(1), fillMaxWidth(), ...(modifiers ?? [])]}
          onValueChange={handleChange}
        >
          {prefix && (
            <OutlinedTextField.LeadingIcon>
              {prefix}
            </OutlinedTextField.LeadingIcon>
          )}
          {label && (
            <OutlinedTextField.Label>
              <Text
                textStyle={{
                  fontFamily: "notosans-regular",
                }}
              >
                {label}
              </Text>
            </OutlinedTextField.Label>
          )}
          {placeholder && (
            <OutlinedTextField.Placeholder>
              <Text {...placeholderProps}>{placeholder}</Text>
            </OutlinedTextField.Placeholder>
          )}
          {suffix && (
            <OutlinedTextField.TrailingIcon>
              {suffix}
            </OutlinedTextField.TrailingIcon>
          )}
          {description && (
            <OutlinedTextField.SupportingText>
              <Text
                textStyle={{
                  fontSize: 12,
                  fontFamily: "notosans-regular",
                }}
              >
                {description}
              </Text>
            </OutlinedTextField.SupportingText>
          )}
        </OutlinedTextField>
      </Host>
    );
  },
);
