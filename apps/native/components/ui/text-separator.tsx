import { cn } from "@kosh-app/utils";
import { View } from "react-native";
import { ThemedText } from "../themed-text";
import { Separator } from "./separator";

interface Props {
  className?: string;
  text: string;
  textClassName?: string;
}

export const TextSeparator = ({ text, className, textClassName }: Props) => {
  return (
    <View
      className={cn("flex-row items-center gap-1 justify-between", className)}
    >
      <Separator className="flex-1" />
      <ThemedText className={cn("text-muted text-xs", textClassName)}>
        {text}
      </ThemedText>
      <Separator className="flex-1" />
    </View>
  );
};
