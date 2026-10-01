import { useHaptics } from "@/hooks/use-haptics";
import { errorToast, successToast } from "@/utils/toast";
import { trpc } from "@/utils/trpc";
import DEMOTE_ICON from "@expo/material-symbols/arrow_downward.xml";
import BADGE_ICON from "@expo/material-symbols/badge.xml";
import CHAT_ICON from "@expo/material-symbols/forum.xml";
import MORE_HORIZ_ICON from "@expo/material-symbols/more_horiz.xml";
import REMOVE_ICON from "@expo/material-symbols/person_remove.xml";
import type { MemberDetailData } from "@kosh-app/api/routers/membership";
import { useMutation } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Alert } from "react-native";

interface Props {
  memberDetails: MemberDetailData;
  refetch: () => void;
}

const KoshMemberOptions = ({ memberDetails, refetch }: Props) => {
  const { id: koshId, userId } = useLocalSearchParams<{
    id: string;
    userId: string;
  }>();
  const router = useRouter();
  const haptics = useHaptics();
  const { member, viewerRole, isSelf, pendingTreasurerInvite } = memberDetails;

  const canInviteTreasurer =
    viewerRole === "adhyaksh" &&
    member.role === "sadasya" &&
    !pendingTreasurerInvite &&
    !isSelf;
  const canDemoteTreasurer =
    viewerRole === "adhyaksh" && member.role === "koshadhyaksh" && !isSelf;

  const canRemoveMember =
    (viewerRole === "adhyaksh" || viewerRole === "koshadhyaksh") &&
    member.role !== "adhyaksh" &&
    !isSelf;

  const directThreadMutation = useMutation(
    trpc.chat.getOrCreateDirectThread.mutationOptions({
      onSuccess: ({ threadId }) => {
        haptics("success");
        router.push(`/chat/${threadId}`);
      },
      onError: (err) => {
        haptics("error");
        errorToast({ title: err.message ?? "Failed to open chat" });
      },
    }),
  );

  const handleMessage = () => {
    if (!koshId || !userId) return;
    directThreadMutation.mutate({ koshId, userId });
  };

  const handleInviteTreasurer = () => {
    Alert.alert(
      "Invite Treasurer",
      `Are you sure you want to invite ${member.name ?? "this member"} to become a Koshadhyaksh (Treasurer)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Invite",
          onPress: () => {
            if (!koshId || !userId) return;
            inviteTreasurerMutation.mutate({ koshId, userId });
          },
        },
      ],
    );
  };

  const handleDemoteTreasurer = () => {
    Alert.alert(
      "Demote Treasurer",
      `Are you sure you want to demote ${member.name ?? "this member"} back to a Sadasya (Member)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Demote",
          style: "destructive",
          onPress: () => {
            if (!koshId || !userId) return;
            demoteTreasurerMutation.mutate({ koshId, userId });
          },
        },
      ],
    );
  };

  const handleRemoveMember = () => {
    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${member.name ?? "this member"} from the kosh? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            if (!koshId || !userId) return;
            removeMemberMutation.mutate({ koshId, userId });
          },
        },
      ],
    );
  };

  const inviteTreasurerMutation = useMutation({
    ...trpc.membership.inviteTreasurer.mutationOptions(),
    onSuccess: () => {
      haptics("success");
      successToast({ title: "Treasurer invitation sent!" });
      refetch();
    },
    onError: (err) => {
      haptics("error");
      errorToast({ title: err.message ?? "Failed to send invitation" });
    },
  });

  const demoteTreasurerMutation = useMutation({
    ...trpc.membership.demoteTreasurer.mutationOptions(),
    onSuccess: () => {
      haptics("success");
      successToast({ title: "Demoted to member" });
      refetch();
    },
    onError: (err) => {
      haptics("error");
      errorToast({ title: err.message ?? "Failed to demote member" });
    },
  });

  const removeMemberMutation = useMutation({
    ...trpc.membership.removeMember.mutationOptions(),
    onSuccess: () => {
      haptics("success");
      successToast({ title: "Member removed from kosh" });
      router.back();
    },
    onError: (err) => {
      haptics("error");
      errorToast({ title: err.message ?? "Failed to remove member" });
    },
  });

  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Menu>
        <Stack.Toolbar.Icon sf="ellipsis.circle" src={MORE_HORIZ_ICON} />
        {!isSelf && (
          <Stack.Toolbar.MenuAction onPress={handleMessage} icon={CHAT_ICON}>
            Message
          </Stack.Toolbar.MenuAction>
        )}
        {canInviteTreasurer && (
          <Stack.Toolbar.MenuAction
            onPress={handleInviteTreasurer}
            icon={BADGE_ICON}
          >
            Invite as Koshadhyaksh
          </Stack.Toolbar.MenuAction>
        )}
        {canDemoteTreasurer && (
          <Stack.Toolbar.MenuAction
            onPress={handleDemoteTreasurer}
            icon={DEMOTE_ICON}
          >
            Demote to Sadasya
          </Stack.Toolbar.MenuAction>
        )}
        {canRemoveMember && (
          <Stack.Toolbar.MenuAction
            onPress={handleRemoveMember}
            destructive
            icon={REMOVE_ICON}
          >
            Remove
          </Stack.Toolbar.MenuAction>
        )}
      </Stack.Toolbar.Menu>
    </Stack.Toolbar>
  );
};

export default KoshMemberOptions;
