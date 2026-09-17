import { ThemedText } from "@/components/themed-text";
import { OutlineButton, PrimaryButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useHaptics } from "@/hooks/use-haptics";
import { errorToast, successToast } from "@/utils/toast";
import { trpc } from "@/utils/trpc";
import type { KoshListItem } from "@kosh-app/api/routers/kosh";
import { formatAmount } from "@kosh-app/utils";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";

interface JoiningKoshPreviewProps {
  preview: KoshListItem;
  token: string;
  onRefetch: () => void;
  onSuccess: () => void;
}

export const JoiningKoshPreview = ({
  preview,
  token,
  onRefetch,
  onSuccess,
}: JoiningKoshPreviewProps) => {
  const router = useRouter();
  const haptics = useHaptics();

  const requestMutation = useMutation(
    trpc.invite.requestJoin.mutationOptions({
      onSuccess: () => {
        // setRequested(true);
        successToast({ title: "Join request sent" });
        onSuccess();
      },
      onError: (error) => {
        haptics("error");
        errorToast({
          title: error.message || "Could not request to join",
        });
        onRefetch();
      },
    }),
  );
  return (
    <View className="p-4 flex-1 justify-center">
      <Card className="gap-3">
        <Card.Body className="items-center gap-3 py-2">
          <Card.Title className="text-center text-xl">
            {preview.kosh.name}
          </Card.Title>
          {preview.kosh.description ? (
            <Card.Description className="text-center text-sm">
              {preview.kosh.description}
            </Card.Description>
          ) : null}
          <View className="flex-row items-center gap-2">
            <ThemedText className="text-sm text-muted">
              NPR {formatAmount(preview.kosh.monthlyAmount)} / month
            </ThemedText>
            <View className="h-1 w-1 rounded-full bg-muted" />
            <ThemedText className="text-sm text-muted">
              {preview.kosh.memberCount}{" "}
              {preview.kosh.memberCount === 1 ? "member" : "members"}
            </ThemedText>
          </View>
          <ThemedText className="text-xs text-muted">
            {preview.expiresAt
              ? `Invite expires ${new Date(
                  preview.expiresAt,
                ).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}`
              : "Invite"}{" "}
            · {preview.useCount} used
            {preview.maxUses ? ` of ${preview.maxUses}` : ""}
          </ThemedText>
        </Card.Body>
        <Card.Footer className="gap-2">
          <PrimaryButton
            onPress={() => requestMutation.mutate({ token })}
            disabled={requestMutation.isPending}
          >
            {requestMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : null}
            <PrimaryButton.Label>
              {requestMutation.isPending ? "Sending…" : "Join this kosh"}
            </PrimaryButton.Label>
          </PrimaryButton>
          <OutlineButton onPress={() => router.replace("/kosh")}>
            <OutlineButton.Label>Not now</OutlineButton.Label>
          </OutlineButton>
        </Card.Footer>
      </Card>
    </View>
  );
};
