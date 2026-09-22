import { useAppTheme } from "@/contexts/app-theme-context";
import { cn } from "@kosh-app/utils";
import { View } from "react-native";
import { Separator } from "../ui/separator";
import { Shimmer, ShimmerGroup } from "../ui/shimmer";

interface Props {
  className?: string;
  withSeparator?: boolean;
  length?: number;
  wrapperClassName?: string;
}

export const KoshCardSkeleton = ({
  className,
  withSeparator = false,
  length = 6,
  wrapperClassName,
}: Props) => {
  const { isDark } = useAppTheme();
  return (
    <View className={cn("gap-y-2", wrapperClassName)}>
      {Array.from({ length }).map((_, index) => (
        <View key={index}>
          <ShimmerGroup className="p-0">
            <View className={className}>
              <View className="flex-row items-center justify-between gap-3 p-3">
                <View className="flex-row items-center gap-3 flex-1 shrink">
                  <Shimmer className="rounded-full size-10" />
                  <View className="flex-1 shrink gap-y-1">
                    <Shimmer className="h-2 w-[80%]" />
                    <View className="flex-row items-center gap-1">
                      <Shimmer className="w-10 h-2" />
                      <Shimmer className="w-20 h-6 rounded-3xl" />
                    </View>
                  </View>
                </View>
                <View className="gap-y-1">
                  <Shimmer className="h-2 w-16" />
                  <Shimmer className="h-2 w-14" />
                </View>
              </View>
              <Separator />
              <View className="flex-row items-center justify-between gap-3 bg-surface-secondary py-3 px-2">
                <Shimmer className="h-2 w-[25%]" />
                <Shimmer className="h-2 w-[25%]" />
              </View>
            </View>
            {index < length - 1 && withSeparator && <Separator />}
          </ShimmerGroup>
        </View>
      ))}
    </View>
  );
};
