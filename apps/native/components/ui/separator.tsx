import { cn } from "@kosh-app/utils";
import { View, ViewProps } from "react-native";

export const Separator = ({ className, style }: ViewProps) => {
  return (
    <View
      className={cn("bg-separator h-hairline w-full", className)}
      style={style}
    />
  );
};
