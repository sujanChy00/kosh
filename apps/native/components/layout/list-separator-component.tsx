import { cn } from "@kosh-app/utils";
import { memo } from "react";
import { View, ViewProps } from "react-native";

export const ListSeparatorComponent = memo(
  ({ className, ...rest }: ViewProps) => (
    <View className={cn("h-2", className)} {...rest} />
  ),
);
