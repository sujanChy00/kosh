import { useHaptics } from "@/hooks/use-haptics";
import { errorToast, successToast } from "@/utils/toast";
import { trpc } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ActivityIndicator } from "react-native";
import { OutlineButton } from "../ui/button";

export const InviteButton = ({ koshId }: { koshId: string }) => {
  const router = useRouter();
  const haptics = useHaptics();
  const mutation = useMutation(
    trpc.invite.create.mutationOptions({
      onSuccess: (data) => {
        successToast({ title: "Invite created" });
        haptics("success");
        router.push({
          pathname: "/kosh/[id]/invite",
          params: {
            id: koshId,
            invitationId: data.id,
            token: data.token,
            expiresAt: data.expiresAt,
            maxUses: data.maxUses,
            useCount: data.useCount,
          },
        });
      },
      onError: (error) => {
        haptics("error");
        errorToast({ title: error.message || "Failed to create invite" });
      },
    }),
  );

  const createInvite = () => {
    if (!koshId) return;
    mutation.mutate({ koshId });
  };

  return (
    <OutlineButton onPress={createInvite}>
      {mutation.isPending && (
        <ActivityIndicator colorClassName="accent-primary-foreground" />
      )}
      <OutlineButton.Label>Invite</OutlineButton.Label>
    </OutlineButton>
  );
};
