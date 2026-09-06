import { View, ViewProps } from "react-native";
import { twMerge } from "tailwind-merge";

export const Separator = ({ className, style }: ViewProps) => {
  return (
    <View
      className={twMerge("bg-separator h-hairline w-full", className)}
      style={style}
    />
  );
};
