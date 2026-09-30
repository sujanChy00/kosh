import { StyledSymbolView } from "@/components/styled-symbol-view";
import { ThemedText } from "@/components/themed-text";
import { Avatar } from "@/components/ui/avatar";
import type { KoshRole } from "@kosh-app/api/routers/kosh";
import { cn } from "@kosh-app/utils";
import { formatShortDate } from "@kosh-app/utils/date";
import { Link } from "expo-router";
import { memo } from "react";
import { TouchableOpacity, View } from "react-native";
import { KoshRoleChip } from "../kosh-role-chip";

interface Props {
  member: {
    userId: string;
    name: string | null;
    image: string | null;
    role: KoshRole;
    joinedAt: string | null;
  };
  koshId: string;
  className?: string;
}

export const KoshMemberCard = memo(({ member, koshId, className }: Props) => {
  return (
    <Link
      asChild
      href={{
        pathname: "/kosh/[id]/[userId]",
        params: {
          id: koshId,
          userId: member.userId,
        },
      }}
    >
      <TouchableOpacity activeOpacity={0.7} className={cn("py-1.5", className)}>
        <View className="flex-row items-center gap-2">
          <Avatar>
            <Avatar.Image source={member.image} alt={member.name ?? ""} />
            <Avatar.Fallback
              source={member.image}
              fallback={member.name ?? ""}
            />
          </Avatar>
          <View className="flex-1 shrink">
            <ThemedText numberOfLines={1} className="capitalize">
              {member.name}
            </ThemedText>
            <View className="flex-row items-center gap-1">
              {member.role === "adhyaksh" ? (
                <KoshRoleChip role={member.role} />
              ) : (
                <ThemedText className="font-mono-regular text-muted capitalize text-xs">
                  {member.role} ·
                </ThemedText>
              )}
              {member.joinedAt && (
                <ThemedText className="text-muted text-xs flex-1">
                  Joined {formatShortDate(new Date(member.joinedAt))}
                </ThemedText>
              )}
            </View>
          </View>
          <StyledSymbolView
            size={18}
            tintColorClassName="accent-muted"
            name={{
              android: "chevron_right",
              ios: "chevron.right",
            }}
          />
        </View>
      </TouchableOpacity>
    </Link>
  );
});
