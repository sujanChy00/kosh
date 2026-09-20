import { ThemedText } from "@/components/themed-text";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import type { KoshActivityItem } from "@kosh-app/api/routers/kosh";
import { formatAmount } from "@kosh-app/utils";
import { formatShortDate } from "@kosh-app/utils/date";
import { Link } from "expo-router";
import { TouchableOpacity, View } from "react-native";

interface Props {
  item: KoshActivityItem;
  isLast: boolean;
}

export const RecentActivityCard = ({ item, isLast }: Props) => {
  return (
    <View>
      <Link
        asChild
        href={{
          pathname: "/kosh/[id]",
          params: { id: item.koshId },
        }}
      >
        <TouchableOpacity activeOpacity={0.7} className="py-1">
          <View className="flex-row items-center gap-3">
            <Avatar className="size-10">
              <Avatar.Image
                source={item.user.image}
                alt={item.user.name ?? ""}
              />
              <Avatar.Fallback
                source={item.user.image}
                fallback={item.user.name ?? ""}
              />
            </Avatar>

            <View className="flex-1 shrink">
              <View className="flex-row items-center justify-between gap-2">
                <ThemedText
                  numberOfLines={1}
                  className="font-notosans-semibold text-sm capitalize flex-1 shrink"
                >
                  {item.title}
                </ThemedText>
                {item.amount && (
                  <ThemedText className="font-mono-semibold text-sm text-primary shrink-0">
                    रु {formatAmount(item.amount)}
                  </ThemedText>
                )}
              </View>

              <View className="flex-row items-center justify-between gap-2 pt-0.5">
                <ThemedText className="text-xs text-muted-foreground flex-1 shrink">
                  {item.koshName} · {item.subtitle}
                </ThemedText>
                <ThemedText className="text-xs text-muted font-mono-regular shrink-0">
                  {formatShortDate(new Date(item.createdAt))}
                </ThemedText>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Link>
      {!isLast && <Separator className="my-1.5" />}
    </View>
  );
};
