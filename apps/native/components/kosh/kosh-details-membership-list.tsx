import type { KoshDetail } from "@kosh-app/api/routers/kosh";
import { formatShortDate } from "@kosh-app/utils/date";
import { Link } from "expo-router";
import { TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";
import { Avatar } from "../ui/avatar";

export const KoshDetailsMembersList = ({ kosh }: { kosh: KoshDetail }) => {
  return (
    <View className="gap-y-2">
      <ThemedText className="font-mono-medium text-xs uppercase text-muted-foreground">
        Members - {kosh.members.length}
        {!!kosh.maxMembers && `/${kosh.maxMembers}`}
      </ThemedText>
      <View>
        {kosh.members.map((item) => (
          <Link
            key={item.userId}
            href={{
              pathname: "/kosh/[id]/[userId]",
              params: {
                id: kosh.id,
                userId: item.userId,
              },
            }}
            asChild
          >
            <TouchableOpacity className="py-1.5">
              <View className="flex-row items-center gap-2">
                <Avatar>
                  <Avatar.Image source={item.image} alt={item.name ?? ""} />
                  <Avatar.Fallback
                    source={item.image}
                    fallback={item.name ?? ""}
                  />
                </Avatar>
                <View className="flex-1 shrink">
                  <ThemedText numberOfLines={1} className="capitalize">
                    {item.name}
                  </ThemedText>
                  <View className="flex-row items-center gap-1">
                    <ThemedText className="font-mono-regular text-muted capitalize text-xs">
                      {item.role}
                    </ThemedText>
                    <ThemedText className="font-mono-regular text-muted text-xs">
                      ·
                    </ThemedText>
                    <ThemedText className="text-muted text-xs">
                      Joined {formatShortDate(new Date(item.joinedAt ?? ""))}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Link>
        ))}
      </View>
    </View>
  );
};
