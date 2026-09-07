import { cn } from "@kosh-app/utils";
import { Text, TextProps } from "react-native";

export const ThemedText = ({ className, ...rest }: TextProps) => {
  return (
    <Text
      className={cn("text-foreground font-notosans-regular", className)}
      {...rest}
    />
  );
};
