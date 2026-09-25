import { cn } from "@kosh-app/utils";
import { Text, TextProps } from "react-native";

export const ThemedText = ({
  className,
  selectable = true,
  ...rest
}: TextProps) => {
  return (
    <Text
      className={cn("text-foreground font-notosans-regular", className)}
      selectable={selectable}
      {...rest}
    />
  );
};
