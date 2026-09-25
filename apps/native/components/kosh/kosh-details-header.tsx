import { KoshDetail } from "@kosh-app/api/routers/kosh";
import { formatAmountCompact } from "@kosh-app/utils";
import { Alert, Pressable, View } from "react-native";
import { CurvedBackground } from "../layout/curved-background";
import { StyledSymbolView } from "../styled-symbol-view";
import { ThemedText } from "../themed-text";
import { Avatar } from "../ui/avatar";
import { KoshOptions } from "./kosh-options";
import { KoshRoleChip } from "./kosh-role-chip";

export const KoshDetailsHeader = ({ kosh }: { kosh: KoshDetail }) => {
  const onShowAmount = (title: string, amount: string) => {
    Alert.alert(title, `₹ ${amount}`);
  };

  return (
    <CurvedBackground height={270}>
      <View className="gap-y-6 px-4 pt-safe-offset-14">
        <View className="flex-row gap-2 items-center w-full">
          <Avatar className="size-16">
            <Avatar.Image source={kosh.iconUrl} alt={kosh.name} />
            <Avatar.Fallback source={kosh.iconUrl} fallback={kosh.name} />
          </Avatar>
          <View className="flex-1 shrink">
            <ThemedText
              numberOfLines={1}
              ellipsizeMode="tail"
              className="text-2xl font-notosans-semibold capitalize text-primary-foreground"
            >
              {kosh.name}
            </ThemedText>
            <View className="flex-row items-center gap-1">
              <ThemedText className="text-gray-300">
                {kosh.memberCount} members ·
              </ThemedText>
              <KoshRoleChip role={kosh.role} />
            </View>
          </View>
          <KoshOptions koshId={kosh.id} role={kosh.role} koshName={kosh.name} />
        </View>
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => {
              onShowAmount("Total Collected", kosh.totalCollected);
            }}
            className="flex-1 min-w-0 flex-row items-center gap-1.5 bg-black/20 p-3 rounded-3xl"
          >
            <View className="size-10 rounded-full items-center justify-center bg-primary/40 shrink-0">
              <StyledSymbolView
                tintColorClassName="accent-warning"
                size={18}
                name={{ android: "database" }}
              />
            </View>
            <View className="flex-1 min-w-0">
              <ThemedText className="text-xs text-gray-300">
                COLLECTED
              </ThemedText>
              <ThemedText
                numberOfLines={1}
                adjustsFontSizeToFit
                className="text-sm text-primary-foreground"
              >
                रु{" "}
                <ThemedText className="font-mono-semibold text-lg text-primary-foreground">
                  {formatAmountCompact(kosh.totalCollected)}
                </ThemedText>
              </ThemedText>
            </View>
          </Pressable>

          <Pressable
            onPress={() => {
              onShowAmount("In Kosh", kosh.totalRemaining);
            }}
            className="flex-1 min-w-0 flex-row items-center gap-1.5 bg-black/20 p-3 rounded-3xl"
          >
            <View className="size-10 rounded-full items-center justify-center bg-primary/40">
              <StyledSymbolView
                tintColorClassName="accent-warning"
                size={18}
                name={{
                  android: "account_balance_wallet",
                }}
              />
            </View>
            <View>
              <ThemedText className="text-xs text-gray-300">IN KOSH</ThemedText>
              <ThemedText className="text-xs text-primary-foreground">
                रु {""}
                <ThemedText className="font-mono-semibold text-lg text-primary-foreground">
                  {formatAmountCompact(kosh.totalRemaining)}
                </ThemedText>
              </ThemedText>
            </View>
          </Pressable>
        </View>
      </View>
    </CurvedBackground>
  );
};
