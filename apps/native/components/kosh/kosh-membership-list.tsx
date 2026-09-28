import type { KoshDetail } from "@kosh-app/api/routers/kosh";
import { View } from "react-native";
import { ThemedText } from "../themed-text";
import { KoshInviteButton } from "./kosh-invite-button";
import { KoshMemberCard } from "./membership/kosh-member-card";

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
          <KoshMemberCard key={item.userId} member={item} koshId={kosh.id} />
        ))}
      </View>
    </View>
  );
};
