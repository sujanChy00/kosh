import { authClient } from "@/lib/auth-client";
import { formatLongDate } from "@kosh-app/utils/date";
import { Link } from "expo-router";
import { TouchableOpacity, View } from "react-native";
import { StyledSymbolView } from "../styled-symbol-view";
import { ThemedText } from "../themed-text";
import { Avatar } from "../ui/avatar";
import { PrimaryButton } from "../ui/button";

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
        <Link href="/notification" asChild>
          <PrimaryButton className="p-0 size-10 relative bg-primary-soft">
            <View className="size-5 bg-danger items-center justify-center rounded-full absolute -top-1 right-1">
              <ThemedText className="text-danger-foreground text-xs font-mono">
                1
              </ThemedText>
            </View>

            <StyledSymbolView
              tintColorClassName="accent-foreground"
              size={20}
              name={{
                android: "notifications",
                ios: "bell",
              }}
            />
          </PrimaryButton>
        </Link>

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
