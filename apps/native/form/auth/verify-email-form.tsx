import { ThemedText } from "@/components/themed-text";
import { AnimatedSpacer } from "@/components/ui/animated-spacer";
import { GhostButton, PrimaryButton } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { TextInput } from "@/components/ui/text-input";
import { TextSeparator } from "@/components/ui/text-separator";
import { isIOS } from "@/constants/platform";
import { useHaptics } from "@/hooks/use-haptics";
import { authClient } from "@/lib/auth-client";
import { errorToast, successToast } from "@/utils/toast";
import { queryClient } from "@/utils/trpc";
import { cn, formatTime } from "@kosh-app/utils";
import { OTP_EXPIRY_SECONDS } from "@kosh-app/utils/constants/data";
import { useCountdown } from "@kosh-app/utils/hooks/use-count-down";
import { Link, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

export const VerifyEmailForm = () => {
  const haptics = useHaptics();
  const { email = "" } = useLocalSearchParams<{ email?: string }>();
  const [token, setToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { secondsLeft, isExpired, restart } = useCountdown(OTP_EXPIRY_SECONDS, {
    onExpire: () => {
      haptics("warning");
      errorToast({
        title: "Verification code expired. Please request a new one.",
      });
    },
  });

  const onVerifyEmail = async () => {
    if (!token.trim() || isExpired) return;
    setIsSubmitting(true);
    await authClient.emailOtp.verifyEmail(
      { email: email.trim(), otp: token.trim() },
      {
        onError(error) {
          haptics("error");
          errorToast({
            title: error.error?.message || "Invalid verification code",
          });
        },
        onSuccess() {
          queryClient.refetchQueries();
          haptics("success");
          successToast({ title: "Email verified successfully" });
        },
      },
    );
    setIsSubmitting(false);
  };

  const onResend = async () => {
    if (isResending) return;
    if (!email.trim()) {
      errorToast({ title: "Email address is required" });
      return;
    }
    setIsResending(true);
    await authClient.emailOtp.sendVerificationOtp(
      { email: email.trim(), type: "email-verification" },
      {
        onError(error) {
          haptics("error");
          errorToast({
            title: error.error?.message || "Failed to resend code",
          });
        },
        onSuccess() {
          haptics("success");
          successToast({ title: "Verification code resent" });
          restart();
          setToken("");
        },
      },
    );
    setIsResending(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={isIOS ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        contentContainerClassName="pt-12 pb-4"
      >
        <View className="px-4 gap-y-10">
          <View className="mb-8 gap-y-3">
            <ThemedText className="text-xs font-mono-semibold uppercase tracking-[0.2em] text-primary">
              One last step
            </ThemedText>
            <ThemedText className="text-balance text-3xl font-notosans-semibold leading-[1.08] tracking-tight">
              Verify your email.
            </ThemedText>
            <ThemedText className="text-pretty text-xs leading-6 text-muted-foreground">
              We sent a 6-digit verification code to{" "}
              <ThemedText className="font-mono-semibold text-danger">
                {email}
              </ThemedText>
            </ThemedText>
          </View>
          <Field>
            <View className="flex-row items-center justify-between gap-2">
              <FieldLabel>Verification Code</FieldLabel>
              <ThemedText
                className={cn(
                  "text-xs font-mono-semibold",
                  isExpired ? "text-danger" : "text-muted-foreground",
                )}
              >
                {isExpired
                  ? "Code expired"
                  : `Expires in: ${formatTime(secondsLeft)}`}
              </ThemedText>
            </View>
            <TextInput
              autoFocus
              value={token}
              onChangeText={setToken}
              maxLength={6}
              keyboardType="number-pad"
            />
          </Field>
          <View className="gap-y-3">
            <GhostButton onPress={onResend} disabled={isResending}>
              <GhostButton.Label className="font-mono-medium uppercase">
                RESEND
              </GhostButton.Label>
              {isResending && (
                <ActivityIndicator colorClassName="accent-primary" />
              )}
            </GhostButton>
            <PrimaryButton
              onPress={onVerifyEmail}
              disabled={!token.trim() || isExpired}
            >
              <PrimaryButton.Label>Verify</PrimaryButton.Label>
            </PrimaryButton>
            <TextSeparator text="OR" />
            <Link
              asChild
              href={{
                pathname: "/sign-in",
                params: {
                  email,
                },
              }}
            >
              <GhostButton>
                <GhostButton.Label>Back to Login</GhostButton.Label>
              </GhostButton>
            </Link>
          </View>
        </View>
        <AnimatedSpacer height={100} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
