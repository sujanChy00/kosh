import { cn, tv } from "@kosh-app/utils";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  BlurEvent,
  FocusEvent,
  TextInput,
  TextInputProps,
  View,
  ViewProps,
} from "react-native";

interface InputGroupContextValue {
  isDisabled: boolean;
  isInvalid: boolean;
  inputFocused: boolean;
  setInputFocused: (focused: boolean) => void;
}

interface InputGroupRootProps extends ViewProps {
  isDisabled?: boolean;
  isInvalid?: boolean;
}

const prefix = tv({
  base: "items-center justify-center px-3",
  variants: {
    isDisabled: { true: "opacity-50" },
  },
  defaultVariants: { isDisabled: false },
});

const suffix = tv({
  base: "items-center justify-center px-3",
  variants: {
    isDisabled: { true: "opacity-50" },
  },
  defaultVariants: { isDisabled: false },
});

const input = tv({
  base: "rounded-2xl bg-surface overflow-hidden shadow",
  variants: {
    isDisabled: { true: "opacity-50" },
    isFocused: { true: "ring-2 ring-primary" },
    isInvalid: { true: "ring-2 ring-danger" },
  },
  defaultVariants: { isDisabled: false, isFocused: false, isInvalid: false },
});

const InputGroupContext = createContext<InputGroupContextValue | null>(null);
const useInputGroup = () => useContext(InputGroupContext);

const Root = forwardRef<View, InputGroupRootProps>(
  (
    { children, isDisabled = false, isInvalid = false, className, ...rest },
    ref,
  ) => {
    const [inputFocused, setInputFocused] = useState(false);

    const contextValue = useMemo(
      () =>
        ({
          isDisabled,
          isInvalid,
          inputFocused,
          setInputFocused,
        }) as InputGroupContextValue,
      [isDisabled, isInvalid, inputFocused, setInputFocused],
    );

    return (
      <InputGroupContext.Provider value={contextValue}>
        <View
          ref={ref}
          className={cn(
            "relative w-full flex-row items-center justify-between",
            input({
              isDisabled,
              isInvalid,
              isFocused: inputFocused && !isInvalid,
              className,
            }),
          )}
          {...rest}
        >
          {children}
        </View>
      </InputGroupContext.Provider>
    );
  },
);

// --------------------------------------------------
interface InputGroupAffixProps extends ViewProps {
  isDecorative?: boolean;
}

const Prefix = forwardRef<View, InputGroupAffixProps>(
  (
    {
      children,
      className,
      isDecorative = false,
      onLayout: onLayoutProp,
      ...rest
    },
    ref,
  ) => {
    const context = useInputGroup();
    const isDisabled = context?.isDisabled ?? false;

    return (
      <View
        ref={ref}
        className={prefix({ isDisabled, className })}
        pointerEvents={isDecorative || isDisabled ? "none" : undefined}
        accessibilityElementsHidden={isDecorative || undefined}
        importantForAccessibility={
          isDecorative ? "no-hide-descendants" : undefined
        }
        {...rest}
      >
        {children}
      </View>
    );
  },
);

const Suffix = forwardRef<View, InputGroupAffixProps>(
  (
    {
      children,
      className,
      isDecorative = false,
      onLayout: onLayoutProp,
      ...rest
    },
    ref,
  ) => {
    const context = useInputGroup();
    const isDisabled = context?.isDisabled ?? false;

    return (
      <View
        ref={ref}
        className={suffix({ isDisabled, className })}
        pointerEvents={isDecorative || isDisabled ? "none" : undefined}
        accessibilityElementsHidden={isDecorative || undefined}
        importantForAccessibility={
          isDecorative ? "no-hide-descendants" : undefined
        }
        {...rest}
      >
        {children}
      </View>
    );
  },
);

const Input = forwardRef<TextInput, TextInputProps>(
  (
    { className, editable, onFocus: onFocusProp, onBlur: onBlurProp, ...rest },
    ref,
  ) => {
    const context = useInputGroup();
    const isDisabled = context?.isDisabled ?? false;

    const handleFocus = useCallback(
      (event: FocusEvent) => {
        context?.setInputFocused(true);
        onFocusProp?.(event);
      },
      [context, onFocusProp],
    );

    const handleBlur = useCallback(
      (event: BlurEvent) => {
        context?.setInputFocused(false);
        onBlurProp?.(event);
      },
      [context, onBlurProp],
    );

    return (
      <TextInput
        {...rest}
        ref={ref}
        editable={editable ?? !isDisabled}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn("py-3.5 text-base text-foreground flex-1", className)}
      />
    );
  },
);

Root.displayName = "InputGroup";
Prefix.displayName = "InputGroup.Prefix";
Suffix.displayName = "InputGroup.Suffix";
Input.displayName = "InputGroup.Input";

export const InputGroup = Object.assign(Root, {
  Prefix,
  Suffix,
  Input,
});
