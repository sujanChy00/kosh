import { cn } from "@kosh-app/utils";
import { ActivityIndicator, View, ViewProps } from "react-native";

export const PendingComponent = ({ className, ...rest }: ViewProps) => {
  return (
    <View className={cn("flex-1 items-center justify-center")} {...rest}>
      <ActivityIndicator size={"large"} />
    </View>
  );
};
