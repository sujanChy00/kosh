import { ThemedText } from "@/components/themed-text";
import { AnimatedSpacer } from "@/components/ui/animated-spacer";
import { GhostButton, PrimaryButton } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { isIOS } from "@/constants/platform";
import { useForm } from "@/hooks/use-form";
import { useHaptics } from "@/hooks/use-haptics";
import { authClient } from "@/lib/auth-client";
import { errorToast, successToast } from "@/utils/toast";
import { queryClient } from "@/utils/trpc";
import { cn, formatTime } from "@kosh-app/utils";
import { OTP_EXPIRY_SECONDS } from "@kosh-app/utils/constants/data";
import { useCountdown } from "@kosh-app/utils/hooks/use-count-down";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import {
  RESET_PASSWORD_FORM_VALUE,
  RESET_PASSWORD_SCHEMA,
} from "./auth-schema";

export const ResetPasswordForm = () => {
  const router = useRouter();
  const haptics = useHaptics();
  const { email = "" } = useLocalSearchParams<{ email?: string }>();
  const [isResending, setIsResending] = useState(false);
  const { secondsLeft, isExpired, restart } = useCountdown(OTP_EXPIRY_SECONDS, {
    onExpire: () => {
      haptics("warning");
      errorToast({ title: "Reset code expired. Please request a new one." });
    },
  });

  const onResend = async () => {
    if (isResending || !email.trim()) return;
    setIsResending(true);
    try {
      await authClient.emailOtp.requestPasswordReset(
        { email: email.trim() },
        {
          onError(error) {
            haptics("error");
            errorToast({
              title: error.error?.message || "Failed to resend code",
            });
          },
          onSuccess() {
            haptics("success");
            successToast({ title: "Reset code resent" });
            restart();
          },
        },
      );
    } finally {
      setIsResending(false);
    }
  };

  const form = useForm({
    defaultValues: {
      confirm_password: "",
      otp: "",
      password: "",
    } satisfies RESET_PASSWORD_FORM_VALUE,
    validators: {
      onSubmit: RESET_PASSWORD_SCHEMA,
    },
    onSubmitInvalid: () => {
      haptics("error");
    },
    onSubmit: async ({ value }) => {
      await authClient.emailOtp.resetPassword(
        {
          email: email.trim(),
          otp: value.otp.trim(),
          password: value.password,
        },
        {
          onError(error) {
            haptics("error");
            errorToast({
              title: error.error?.message || "Failed to reset password",
            });
          },
          onSuccess() {
            queryClient.refetchQueries();
            successToast({ title: "Password reset successfully" });
            router.replace({ pathname: "/sign-in", params: { email } });
          },
        },
      );
    },
  });

  return (
    <form.AppForm>
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
                Choose a new password
              </ThemedText>
              <ThemedText className="text-balance text-3xl font-notosans-semibold leading-[1.08] tracking-tight">
                Reset your password
              </ThemedText>
              <ThemedText className="text-pretty text-xs leading-6 text-muted-foreground">
                We sent a 6-digit verification code to{" "}
                {email ? (
                  <ThemedText className="font-mono-semibold text-danger">
                    {email}
                  </ThemedText>
                ) : null}
              </ThemedText>
            </View>
            <form.AppField
              name="otp"
              children={(field) => (
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
                  <field.TextField
                    maxLength={6}
                    keyboardType="number-pad"
                    inputClassName="px-3"
                  />
                </Field>
              )}
            />
            <form.AppField
              name="password"
              children={(field) => (
                <field.PasswordField
                  label="New Password"
                  placeholder="********"
                />
              )}
            />
            <form.AppField
              name="confirm_password"
              children={(field) => (
                <field.PasswordField
                  label="Confirm Password"
                  placeholder="********"
                />
              )}
            />

            <View className="gap-y-3">
              <GhostButton onPress={onResend} disabled={isResending}>
                <GhostButton.Label className="font-mono-medium uppercase">
                  RESEND
                </GhostButton.Label>
                {isResending && (
                  <ActivityIndicator colorClassName="accent-primary" />
                )}
              </GhostButton>
              <form.SubmitButton>
                <PrimaryButton.Label>Reset Password</PrimaryButton.Label>
              </form.SubmitButton>
            </View>
          </View>
          <AnimatedSpacer height={100} />
        </ScrollView>
      </KeyboardAvoidingView>
    </form.AppForm>
  );
};
