import { StyledSymbolView } from "@/components/styled-symbol-view";
import { ThemedText } from "@/components/themed-text";
import { SecondaryButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useHaptics } from "@/hooks/use-haptics";
import { errorToast, successToast } from "@/utils/toast";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Share, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

type CreatedInvite = {
  id: string;
  token: string;
  expiresAt: string | Date;
  maxUses: number | null;
  useCount: number;
};

const ROLE_LABELS: Record<string, string> = {
  adhyaksh: "Adhyaksh",
  koshadhyaksh: "Koshadhyaksh",
  sadasya: "Sadasya",
};

const CopyableValue = ({
  label,
  value,
  mono = false,
  onCopy,
}: {
  label: string;
  value: string;
  mono?: boolean;
  onCopy: () => void;
}) => (
  <View className="gap-1">
    <ThemedText className="text-xs text-muted">{label}</ThemedText>
    <View className="flex-row items-center gap-2">
      <View className="flex-1 rounded-2xl bg-default px-3 py-2">
        <ThemedText
          className={
            mono ? "font-mono-semibold text-base tracking-[0.2em]" : "text-sm"
          }
          numberOfLines={1}
        >
          {value}
        </ThemedText>
      </View>
      <TouchableOpacity
        onPress={onCopy}
        accessibilityRole="button"
        accessibilityLabel={`Copy ${label}`}
        className="rounded-xl bg-primary/15 px-3 py-2"
      >
        <ThemedText className="text-sm font-medium text-primary">
          Copy
        </ThemedText>
      </TouchableOpacity>
    </View>
  </View>
);

const InviteScreen = () => {
  const { id: koshId } = useLocalSearchParams<{ id: string }>();
  const haptics = useHaptics();
  const [invite, setInvite] = useState<CreatedInvite | null>(null);

  const { data: koshData } = useQuery({
    ...trpc.kosh.getById.queryOptions({ koshId: koshId! }),
    enabled: !!koshId,
  });

  const inviteLink = invite
    ? Linking.createURL("/join", { queryParams: { token: invite.token } })
    : null;

  const mutation = useMutation(
    trpc.invite.create.mutationOptions({
      onSuccess: (data) => {
        haptics("success");
        setInvite({
          id: data.id,
          token: data.token,
          expiresAt: data.expiresAt,
          maxUses: data.maxUses,
          useCount: data.useCount,
        });
        successToast({ title: "Invite created" });
      },
      onError: (error) => {
        haptics("error");
        errorToast({ title: error.message || "Failed to create invite" });
      },
    }),
  );

  const copy = async (label: string, value: string) => {
    await Clipboard.setStringAsync(value);
    haptics("success");
    successToast({ title: `${label} copied` });
  };

  const koshName = koshData?.name ?? "";
  const role = koshData?.role;

  const shareInvite = async () => {
    if (!invite || !inviteLink) return;
    try {
      // Native share sheet (Messages, WhatsApp, Gmail, etc.). iOS ignores the
      // `url` prop, so the link lives inside `message`.
      await Share.share({
        title: `Join ${koshName} on Kosh`,
        message: `Join "${koshName}" on Kosh.\n\nUse invite code: ${invite.token}\nOr open: ${inviteLink}`,
        url: inviteLink,
      });
    } catch {
      // Share sheet dismissed — nothing to do.
    }
  };

  const createInvite = () => {
    if (!koshId) return;
    mutation.mutate({ koshId });
  };

  return (
    <View>
      {invite && inviteLink ? (
        <Card className="gap-3">
          <Card.Header className="flex-row items-center justify-between">
            <Card.Title className="text-base">Share this invite</Card.Title>
            <TouchableOpacity
              onPress={shareInvite}
              accessibilityRole="button"
              accessibilityLabel="Share invite"
              className="rounded-full bg-primary/15 p-2"
            >
              <StyledSymbolView
                name={{ android: "share", ios: "square.and.arrow.up" }}
                size={20}
                tintColorClassName="text-primary"
              />
            </TouchableOpacity>
          </Card.Header>
          <Card.Body className="gap-3">
            <View className="items-center gap-2">
              <ThemedText className="text-xs uppercase tracking-[0.2em] text-muted">
                Invite code
              </ThemedText>
              <ThemedText className="font-mono-semibold text-2xl tracking-[0.25em] text-primary">
                {invite.token}
              </ThemedText>
              <TouchableOpacity
                onPress={() => copy("Invite code", invite.token)}
                accessibilityRole="button"
                accessibilityLabel="Copy invite code"
                className="rounded-xl bg-primary/15 px-3 py-1.5"
              >
                <ThemedText className="text-sm font-medium text-primary">
                  Copy code
                </ThemedText>
              </TouchableOpacity>
            </View>

            <View className="items-center gap-1">
              <View className="rounded-2xl bg-white p-3">
                <QRCode
                  value={inviteLink}
                  size={196}
                  color="#0B1220"
                  backgroundColor="#ffffff"
                  quietZone={8}
                />
              </View>
              <ThemedText className="text-xs text-muted">
                Scan to open the invite
              </ThemedText>
            </View>

            <CopyableValue
              label="Invite link"
              value={inviteLink}
              onCopy={() => copy("Invite link", inviteLink)}
            />

            <ThemedText className="text-xs text-muted">
              Expires{" "}
              {new Date(invite.expiresAt).toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}{" "}
              · {invite.useCount} used
              {invite.maxUses ? ` of ${invite.maxUses}` : ""}
            </ThemedText>
          </Card.Body>
          <Card.Footer className="gap-2">
            <SecondaryButton onPress={shareInvite} className="w-full">
              <StyledSymbolView
                name={{ android: "share", ios: "square.and.arrow.up" }}
                size={18}
                tintColorClassName="text-primary"
              />
              <SecondaryButton.Label>Share invite</SecondaryButton.Label>
            </SecondaryButton>
          </Card.Footer>
        </Card>
      ) : mutation.isPending ? (
        <View className="items-center justify-center py-6">
          <ActivityIndicator />
        </View>
      ) : null}
    </View>
  );
};

export default InviteScreen;
