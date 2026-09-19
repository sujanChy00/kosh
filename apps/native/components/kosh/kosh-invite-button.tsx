import { useHaptics } from "@/hooks/use-haptics";
import { errorToast, successToast } from "@/utils/toast";
import { trpc } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable } from "react-native";
import { StyledSymbolView } from "../styled-symbol-view";
import { ThemedText } from "../themed-text";

export const KoshInviteButton = ({ koshId }: { koshId: string }) => {
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
    <Pressable
      hitSlop={10}
      onPress={createInvite}
      className="flex-row items-center gap-1"
    >
      <ThemedText className="text-sky-200">Invite</ThemedText>
      {mutation.isPending ? (
        <ActivityIndicator colorClassName="accent-sky-200" />
      ) : (
        <StyledSymbolView
          tintColorClassName="accent-sky-200"
          size={18}
          name={{
            android: "person_add",
          }}
        />
      )}
    </Pressable>
  );
};
