import { View } from "react-native";
import { Separator } from "../ui/separator";
import { Shimmer, ShimmerGroup } from "../ui/shimmer";

interface RecentActivityCardSkeletonProps {
  length?: number;
}

export const RecentActivityCardSkeleton = ({
  length = 3,
}: RecentActivityCardSkeletonProps) => {
  return Array.from({ length }).map((_, index) => (
    <View className="gap-y-2" key={index}>
      <ShimmerGroup>
        <View className="flex-row items-center gap-3">
          <Shimmer className="size-10 rounded-full" />
          <View className="flex-1 shrink gap-y-2">
            <Shimmer className="w-[70%] h-2" />
            <View className="gap-y-1">
              <Shimmer className="w-full h-2" />
              <Shimmer className="w-[40%] h-2" />
            </View>
          </View>
          <View className="self-end">
            <Shimmer className="h-2 w-10" />
          </View>
        </View>
      </ShimmerGroup>
      {index < length - 1 && <Separator />}
    </View>
  ));
};
