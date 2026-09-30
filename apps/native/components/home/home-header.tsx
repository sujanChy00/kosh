import { authClient } from "@/lib/auth-client";
import { formatLongDate } from "@kosh-app/utils/date";
import { Link } from "expo-router";

import { TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";
import { Avatar } from "../ui/avatar";
import { NotificationButton } from "./notfication-button";

export const HomeHeader = () => {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const todayDate = formatLongDate(new Date());

  return (
    <View className="flex-row gap-3 justify-between items-center">
      <View className="flex-1 min-w-0">
        <ThemedText className="text-muted text-xs font-mono-medium">
          {todayDate}
        </ThemedText>

        <ThemedText
          className="font-notosans-semibold text-xl capitalize"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          Namaste, {user?.name}
        </ThemedText>
      </View>

      <View className="flex-row items-center gap-2 shrink-0">
        <NotificationButton />
        <Link href="/setting" asChild>
          <TouchableOpacity>
            <Avatar>
              <Avatar.Image alt={user?.name} source={user?.image} />
              <Avatar.Fallback
                source={user?.image}
                fallback={user?.name ?? ""}
              />
            </Avatar>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
};
