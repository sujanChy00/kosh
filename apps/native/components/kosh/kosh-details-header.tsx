import { KoshDetail } from "@kosh-app/api/routers/kosh";
import { formatAmount } from "@kosh-app/utils";
import { View } from "react-native";
import { CurvedBackground } from "../layout/curved-background";
import { StyledSymbolView } from "../styled-symbol-view";
import { ThemedText } from "../themed-text";
import { Avatar } from "../ui/avatar";
import { Chip } from "../ui/chip";
import { KoshOptions } from "./kosh-options";

export const KoshDetailsHeader = ({ kosh }: { kosh: KoshDetail }) => {
  return (
    <CurvedBackground height={270}>
      <View className="gap-y-6 px-4 pt-safe-offset-14">
        <View className="gap-y-1 w-full">
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
                <Chip variant="soft" color="warning" size="sm">
                  <Chip.Label className="uppercase font-mono-medium">
                    {kosh.role}
                  </Chip.Label>
                </Chip>
              </View>
            </View>
            <KoshOptions koshId={kosh.id} />
          </View>
          {kosh.description && (
            <ThemedText className="text-gray-300-foreground text-xs">
              {kosh.description}
            </ThemedText>
          )}
        </View>
        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center gap-1.5 bg-black/20 p-3 pr-5 rounded-3xl">
            <View className="size-10 rounded-full items-center justify-center bg-primary/40">
              <StyledSymbolView
                tintColorClassName="accent-warning"
                size={18}
                name={{
                  android: "database",
                }}
              />
            </View>
            <View>
              <ThemedText className="text-xs text-gray-300">
                COLLECTED
              </ThemedText>
              <ThemedText className="text-base">
                रु {""}
                <ThemedText className="font-mono-semibold text-2xl">
                  {formatAmount(kosh.totalCollected)}
                </ThemedText>
              </ThemedText>
            </View>
          </View>

          <View className="flex-row items-center gap-1.5 bg-black/20 p-3 pr-6 rounded-3xl">
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
              <ThemedText className="text-base">
                रु {""}
                <ThemedText className="font-mono-semibold text-2xl">
                  {formatAmount(kosh.totalRemaining)}
                </ThemedText>
              </ThemedText>
            </View>
          </View>
        </View>
      </View>
    </CurvedBackground>
  );
};
