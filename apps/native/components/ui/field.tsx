import { cn } from "@kosh-app/utils";
import { TextProps, View, ViewProps } from "react-native";
import { FadeInUp, FadeOut } from "react-native-reanimated";
import { AnimatedView } from "../animated-view";
import { ThemedText } from "../themed-text";

interface FieldLabelProps extends TextProps {
  isInvalid?: boolean;
  isDisabled?: boolean;
}

const Field = ({ className, children }: ViewProps) => {
  return <View className={cn("gap-1.5 w-full", className)}>{children}</View>;
};

const FieldLabel = ({
  className,
  isInvalid = false,
  isDisabled = false,
  ...rest
}: FieldLabelProps) => {
  return (
    <ThemedText
      className={cn(
        "font-notosans-medium",
        isInvalid ? "text-danger" : "text-foreground",
        isDisabled ? "text-muted" : undefined,
        className,
      )}
      {...rest}
    />
  );
};
const FieldError = ({ className, ...rest }: TextProps) => {
  return (
    <AnimatedView
      entering={FadeInUp.duration(150)}
      exiting={FadeOut.duration(100)}
    >
      <ThemedText className={cn("text-danger text-sm", className)} {...rest} />
    </AnimatedView>
  );
};
const FieldDescription = ({ className, ...rest }: TextProps) => {
  return (
    <ThemedText className={cn("text-muted text-xs", className)} {...rest} />
  );
};

export { Field, FieldDescription, FieldError, FieldLabel };
