import { cn } from "@kosh-app/utils";
import { memo } from "react";
import { ActivityIndicator, View } from "react-native";

interface Props {
  isFetchingNextPage: boolean;
  className?: string;
  hasNextPage?: boolean;
}

export const ListFetchingMoreComponent = memo(
  ({ isFetchingNextPage, className, hasNextPage }: Props) => {
    if (!isFetchingNextPage || !hasNextPage) return null;

    return (
      <View className={cn("items-center justify-center py-4", className)}>
        <ActivityIndicator />
      </View>
    );
  },
);
