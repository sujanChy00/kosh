import { ThemedText } from "@/components/themed-text";
import { Card } from "@/components/ui/card";
import type { KoshActivityItem } from "@kosh-app/api/routers/kosh";
import { Link } from "expo-router";
import { View } from "react-native";
import { StyledSymbolView } from "../styled-symbol-view";
import { SecondaryButton } from "../ui/button";
import { RecentActivityCard } from "./recent-activity-card";
import { RecentActivityCardSkeleton } from "./recent-activity-card-skeleton";

export interface RecentActivityListProps {
  activities: KoshActivityItem[];
  isPending: boolean;
}

export function RecentActivityList({
  activities,
  isPending,
}: RecentActivityListProps) {
  if (isPending)
    return (
      <View className="gap-y-2">
        <View className="flex-row items-center gap-3 justify-between">
          <ThemedText className="font-mono-medium text-xs uppercase text-muted-foreground">
            Recent Activity
          </ThemedText>
          <Link
            href={{
              pathname: "/recent-activities",
            }}
            asChild
          >
            <SecondaryButton hitSlop={10} className="px-3 bg-transparent h-7">
              <ThemedText className="text-xs font-mono-regular text-primary">
                View All
              </ThemedText>
              <StyledSymbolView
                name={{
                  android: "arrow_right_alt",
                  ios: "arrow.right",
                }}
                size={16}
                tintColorClassName="accent-primary"
              />
            </SecondaryButton>
          </Link>
        </View>
        <Card className="gap-y-2">
          <RecentActivityCardSkeleton />
        </Card>
      </View>
    );

  if (!activities || activities.length === 0) return null;

  return (
    <View className="gap-y-2">
      <View className="flex-row items-center gap-3 justify-between">
        <ThemedText className="font-mono-medium text-xs uppercase text-muted-foreground">
          Recent Activity
        </ThemedText>
        <Link
          href={{
            pathname: "/recent-activities",
          }}
          asChild
        >
          <SecondaryButton hitSlop={10} className="px-3 bg-transparent h-7">
            <ThemedText className="text-xs font-mono-regular text-primary">
              View All
            </ThemedText>
            <StyledSymbolView
              name={{
                android: "arrow_right_alt",
                ios: "arrow.right",
              }}
              size={16}
              tintColorClassName="accent-primary"
            />
          </SecondaryButton>
        </Link>
      </View>
      <Card className="gap-y-2">
        {activities.map((item, index) => (
          <RecentActivityCard
            key={item.id}
            item={item}
            isLast={index === activities.length - 1}
          />
        ))}
      </Card>
    </View>
  );
}
