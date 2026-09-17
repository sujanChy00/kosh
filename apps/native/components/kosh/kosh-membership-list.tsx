import type { KoshDetail } from "@kosh-app/api/routers/kosh";
import { formatShortDate } from "@kosh-app/utils/date";
import { Link } from "expo-router";
import { TouchableOpacity, View } from "react-native";
import { StyledSymbolView } from "../styled-symbol-view";
import { ThemedText } from "../themed-text";
import { Avatar } from "../ui/avatar";
import { Chip } from "../ui/chip";
import { KoshInviteButton } from "./kosh-invite-button";

export const KoshMembersList = ({ kosh }: { kosh: KoshDetail }) => {
  return (
    <View className="gap-y-2">
      <View className="flex-row items-center gap-3 justify-between">
        <ThemedText className="font-mono-medium text-xs uppercase text-muted-foreground">
          Members - {kosh.members.length}
          {!!kosh.maxMembers && `/${kosh.maxMembers}`}
        </ThemedText>
        <KoshInviteButton koshId={kosh.id} />
      </View>
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
                    {item.role === "adhyaksh" ? (
                      <Chip
                        size="sm"
                        variant="soft"
                        color="warning"
                        className="shrink-0"
                      >
                        <StyledSymbolView
                          tintColorClassName="accent-warning"
                          size={14}
                          name={{
                            android: "crown",
                          }}
                        />
                        <Chip.Label className="capitalize shrink">
                          {item.role}
                        </Chip.Label>
                      </Chip>
                    ) : (
                      <ThemedText className="font-mono-regular text-muted capitalize text-xs">
                        {item.role} ·
                      </ThemedText>
                    )}
                    <ThemedText className="text-muted text-xs flex-1">
                      Joined {formatShortDate(new Date(item.joinedAt ?? ""))}
                    </ThemedText>
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
        ))}
      </View>
    </View>
  );
};
