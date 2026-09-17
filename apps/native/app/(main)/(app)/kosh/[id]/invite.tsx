import { AnimatedView } from "@/components/animated-view";
import { Host } from "@/components/layout/host";
import { StyledSymbolView } from "@/components/styled-symbol-view";
import { ThemedText } from "@/components/themed-text";
import { SecondaryButton } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAppTheme } from "@/contexts/app-theme-context";
import { useHaptics } from "@/hooks/use-haptics";
import { errorToast, successToast } from "@/utils/toast";
import { trpc } from "@/utils/trpc";
import { LinearProgressIndicator } from "@expo/ui/jetpack-compose";
import { formatRemainingDays, formatShortDate } from "@kosh-app/utils/date";
import { useQuery } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { File, Paths } from "expo-file-system";
import * as Linking from "expo-linking";
import { useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { useMemo, useRef, useState } from "react";
import { ScrollView, Share, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SlideInDown } from "react-native-reanimated";
import { captureRef } from "react-native-view-shot";

const InviteScreen = () => {
  const { colors } = useAppTheme();
  const {
    id: koshId,
    token,
    expiresAt,
    useCount,
    maxUses,
  } = useLocalSearchParams<{
    id: string;
    token: string;
    expiresAt: string;
    useCount: string;
    maxUses: string;
  }>();
  const haptics = useHaptics();
  const [isSharingQr, setIsSharingQr] = useState(false);
  const [isSharingText, setIsSharingText] = useState(false);
  const qrCardRef = useRef<View>(null);

  const { data: koshData } = useQuery({
    ...trpc.kosh.getById.queryOptions({ koshId: koshId! }),
    enabled: !!koshId,
  });

  const inviteLink = Linking.createURL("/join", { queryParams: { token } });

  const onCopy = async (label: string, value: string) => {
    await Clipboard.setStringAsync(value);
    haptics("success");
    successToast({ title: `${label} copied` });
  };

  const koshName = koshData?.name ?? "";

  const shareQrCode = async () => {
    if (!qrCardRef.current) return;
    setIsSharingQr(true);
    haptics("selection");

    let destFile: File | null = null;

    try {
      const uri = await captureRef(qrCardRef, {
        format: "png",
        quality: 1,
      });

      const sourceFile = new File(uri);
      destFile = new File(Paths.cache, `kosh-invite-${token}.png`);
      sourceFile.copy(destFile, { overwrite: true });

      const available = await Sharing.isAvailableAsync();
      if (!available) {
        errorToast({ title: "Sharing isn't available on this device" });
        return;
      }

      await Sharing.shareAsync(destFile.uri, {
        mimeType: "image/png",
        dialogTitle: `Join ${koshName} on Kosh`,
        UTI: "public.png",
      });
    } catch (error) {
      haptics("error");
      errorToast({
        title:
          error instanceof Error ? error.message : "Couldn't share QR code",
      });
    } finally {
      if (destFile) {
        try {
          destFile.delete();
        } catch {
          // already gone or inaccessible — nothing to do
        }
      }
      setIsSharingQr(false);
    }
  };

  const shareCodeAndLink = async () => {
    if (!inviteLink) return;
    setIsSharingText(true);
    haptics("selection");
    try {
      await Share.share({
        title: `Join ${koshName} on Kosh`,
        message: `Join "${koshName}" on Kosh.\n\nUse invite code: ${token}\nOr open: ${inviteLink}`,
        url: inviteLink, // iOS only — Android ignores this and just uses `message`
      });
    } catch (error) {
      haptics("error");
      errorToast({
        title: error instanceof Error ? error.message : "Couldn't share invite",
      });
    } finally {
      setIsSharingText(false);
    }
  };

  const usedValue = useMemo(() => {
    return Number(useCount) / Number(maxUses);
  }, [maxUses, useCount]);

  const usedPercentage = useMemo(() => {
    return usedValue * 100;
  }, [usedValue]);

  return (
    <View className="flex-1">
      <ScrollView
        contentContainerClassName="p-4 gap-y-6 pb-safe-offset-24"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-y-6">
          <View className="gap-y-1">
            <ThemedText className="font-notosans-semibold text-lg">
              Invite Members
            </ThemedText>
            <ThemedText className="text-muted-foreground text-xs">
              Share this invite so others can join. Anyone with the code, link,
              or QR can use it until it expires.
            </ThemedText>
          </View>
          <View
            ref={qrCardRef}
            collapsable={false}
            className="items-center bg-surface rounded-2xl overflow-hidden"
          >
            <View className="pt-6">
              <QRCode value={inviteLink} size={200} quietZone={8} />
            </View>
            <ThemedText className="font-notosans-semibold text-base pt-4">
              {koshName}
            </ThemedText>
            <Separator />
            <View className="flex-row items-center gap-3 justify-center px-3 py-5 bg-surface-secondary w-full">
              <ThemedText className="uppercase font-mono-regular">
                Scan to Join
              </ThemedText>
              <TouchableOpacity
                onPress={shareQrCode}
                disabled={isSharingQr}
                hitSlop={10}
              >
                <StyledSymbolView
                  name={{ android: "share", ios: "square.and.arrow.up" }}
                  size={20}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View className="gap-y-1">
          <ThemedText className="text-muted-foreground font-mono-regular uppercase">
            Invite Code
          </ThemedText>
          <View className="flex-row items-center justify-between gap-3 bg-surface p-4 rounded-2xl">
            <ThemedText className="font-mono-regular text-base">
              {token}
            </ThemedText>
            <TouchableOpacity
              hitSlop={10}
              onPress={() => {
                onCopy("Invite Code", token);
              }}
            >
              <StyledSymbolView
                name={{ android: "content_copy", ios: "doc.on.doc" }}
                size={20}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View className="gap-y-1">
          <ThemedText className="text-muted-foreground font-mono-regular uppercase">
            Invite Link
          </ThemedText>
          <View className="flex-row items-center justify-between gap-3 bg-surface p-4 rounded-2xl">
            <ThemedText
              className="font-mono-regular flex-1 shrink text-xs"
              numberOfLines={1}
            >
              {inviteLink}
            </ThemedText>
            <TouchableOpacity
              hitSlop={10}
              onPress={() => {
                onCopy("Invite Link", inviteLink!);
              }}
            >
              <StyledSymbolView
                name={{ android: "content_copy", ios: "doc.on.doc" }}
                size={20}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row items-center justify-between gap-3 bg-surface p-3 rounded-2xl">
          <ThemedText>Expires In</ThemedText>
          <View>
            <ThemedText className="text-right">
              {formatShortDate(new Date(expiresAt ?? ""))}{" "}
            </ThemedText>
            <ThemedText className="text-muted-foreground text-xs text-right">
              {formatRemainingDays(new Date(expiresAt ?? ""))}
            </ThemedText>
          </View>
        </View>
        <View className="bg-surface p-3 rounded-2xl gap-y-3">
          <View className="flex-row items-center gap-3 justify-between">
            <ThemedText>
              Usage ·{" "}
              <ThemedText className="font-mono-regular text-muted-foreground">
                {useCount}/{maxUses}
              </ThemedText>
            </ThemedText>
            <ThemedText className="text-primary font-mono-regular">
              {usedPercentage}%
            </ThemedText>
          </View>
          <Host
            style={{ width: "100%" }}
            matchContents={{
              vertical: true,
            }}
          >
            <LinearProgressIndicator
              progress={usedValue}
              color={colors.primary}
              gapSize={0}
              drawStopIndicator={{ stopSize: 0 }}
            />
          </Host>
        </View>
      </ScrollView>
      <AnimatedView
        className="absolute bottom-0 p-3 pb-safe-offset-6 w-full gap-y-2"
        entering={SlideInDown.duration(400)}
      >
        <SecondaryButton onPress={shareCodeAndLink} disabled={isSharingText}>
          <StyledSymbolView
            name={{ android: "link", ios: "link" }}
            size={20}
            tintColorClassName="accent-primary"
          />
          <SecondaryButton.Label>
            {isSharingText ? "Preparing..." : "Share code & link"}
          </SecondaryButton.Label>
        </SecondaryButton>
      </AnimatedView>
    </View>
  );
};

export default InviteScreen;
