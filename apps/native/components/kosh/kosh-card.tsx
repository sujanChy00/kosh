import type { KoshListItem } from "@kosh-app/api/routers/kosh";
import { formatAmount } from "@kosh-app/utils";
import { formatShortDate } from "@kosh-app/utils/date";
import { Link } from "expo-router";
import { memo } from "react";
import { TouchableOpacity, View } from "react-native";
import { StyledSymbolView } from "../styled-symbol-view";
import { ThemedText } from "../themed-text";
import { Avatar } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { KoshRoleChip } from "./kosh-role-chip";

interface Props {
  kosh: KoshListItem;
  className?: string;
  withSeparator?: boolean;
  isLast?: boolean;
}

export const KoshCard = memo(
  ({ kosh, className, withSeparator = false, isLast }: Props) => {
    return (
      <Link
        asChild
        href={{
          pathname: "/kosh/[id]",
          params: {
            id: String(kosh.id),
          },
        }}
      >
        <TouchableOpacity activeOpacity={0.7}>
          <View className={className}>
            <View className="flex-row items-center justify-between gap-3 p-3">
              <View className="flex-row items-center gap-3 flex-1 shrink">
                <Avatar>
                  <Avatar.Image source={kosh.iconUrl} alt={kosh.name} />
                  <Avatar.Fallback fallback={kosh.name} source={kosh.iconUrl} />
                </Avatar>
                <View className="flex-1 shrink">
                  <ThemedText
                    numberOfLines={1}
                    className="font-notosans-semibold text-sm capitalize flex-1 shrink"
                  >
                    {kosh.name}
                  </ThemedText>
                  <View className="flex-row items-center gap-1">
                    <ThemedText className="text-sm text-muted-foreground">
                      {kosh.memberCount}
                    </ThemedText>
                    <StyledSymbolView
                      size={16}
                      tintColorClassName="accent-muted-foreground"
                      name={{
                        android: "group",
                      }}
                    />
                    <ThemedText className="text-xs text-muted-foreground">
                      ·
                    </ThemedText>
                    <KoshRoleChip role={kosh.role} />
                  </View>
                </View>
              </View>
              <View>
                <ThemedText className="font-mono-semibold text-sm text-primary">
                  रु {formatAmount(kosh.monthlyAmount)}
                </ThemedText>
                <ThemedText className="text-xs text-muted font-mono-regular shrink-0">
                  {formatShortDate(new Date(kosh.startDate))}
                </ThemedText>
              </View>
            </View>
            <Separator />
            <View className="flex-row items-center justify-between gap-3 bg-surface-secondary py-3 px-2">
              <ThemedText className="font-mono-medium text-muted-foreground">
                Collected : रु {formatAmount(kosh.totalCollected)}
              </ThemedText>
              <ThemedText className="font-mono-medium">
                In Kosh : रु {formatAmount(kosh.totalRemaining)}
              </ThemedText>
            </View>
            {!isLast && withSeparator && <Separator />}
          </View>
        </TouchableOpacity>
      </Link>
    );
  },
);
