import { TransactionPinPasswordDialog } from "@/components/kosh/transaction-pin/transaction-pin-password-dialog";
import { ThemedText } from "@/components/themed-text";
import { AnimatedSpacer } from "@/components/ui/animated-spacer";
import { GhostButton, PrimaryButton } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  FORGOT_TRANSACTION_PIN_FORM_VALUES,
  forgotTransactionPinSchema,
} from "@/form/kosh/transaction-pin-schema";
import { useForm } from "@/hooks/use-form";
import { useHaptics } from "@/hooks/use-haptics";
import { errorToast, successToast } from "@/utils/toast";
import { queryClient, trpc } from "@/utils/trpc";
import { cn, formatTime } from "@kosh-app/utils";
import { OTP_EXPIRY_SECONDS } from "@kosh-app/utils/constants/data";
import { useCountdown } from "@kosh-app/utils/hooks/use-count-down";
import { useMutation } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";

const ForgotTransactionPinScreen = () => {
  const router = useRouter();
  const haptics = useHaptics();
  const params = useLocalSearchParams<{ id: string; email?: string }>();
  const koshId = params.id;
  const maskedEmail = params.email ?? "";
  const [passwordVisible, setPasswordVisible] = useState(false);
  const { secondsLeft, isExpired, restart } = useCountdown(OTP_EXPIRY_SECONDS, {
    onExpire: () => {
      haptics("warning");
      errorToast({ title: "Reset code expired. Please request a new one." });
    },
  });

  const { resendMutation, handleResend } = (() => {
    const resendMutation = useMutation(
      trpc.kosh.requestTransactionPinReset.mutationOptions({
        onSuccess: (data) => {
          haptics("success");
          successToast({ title: "Reset code resent" });
          router.setParams({ email: data.maskedEmail });
          restart();
        },
        onError: (error) => {
          haptics("error");
          errorToast({ title: error.message || "Failed to resend code" });
        },
      }),
    );

    const handleResend = () => {
      if (resendMutation.isPending) return;
      resendMutation.mutate({ koshId });
    };
    return { resendMutation, handleResend };
  })();

  const { resetMutation, handleReset } = (() => {
    const resetMutation = useMutation(
      trpc.kosh.resetTransactionPin.mutationOptions({
        onSuccess: () => {
          haptics("success");
          successToast({ title: "Transaction PIN reset" });
          queryClient.invalidateQueries({
            queryKey: trpc.kosh.getById.queryKey({ koshId }),
          });
          router.replace({ pathname: "/kosh/[id]", params: { id: koshId } });
        },
        onError: (error) => {
          haptics("error");
          errorToast({ title: error.message || "Failed to reset PIN" });
        },
      }),
    );

    const handleReset = (password: string) => {
      const { otp, newPin } = form.store.state.values;
      resetMutation.mutate({ koshId, otp, newPin, password });
    };
    return { resetMutation, handleReset };
  })();

  const form = useForm({
    defaultValues: {
      otp: "",
      newPin: "",
      confirmPin: "",
    } satisfies FORGOT_TRANSACTION_PIN_FORM_VALUES,
    validators: {
      onSubmit: forgotTransactionPinSchema,
    },
    onSubmit: () => {
      setPasswordVisible(true);
    },
    onSubmitInvalid: () => {
      haptics("error");
    },
  });

  return (
    <form.AppForm>
      <TransactionPinPasswordDialog
        onConfirm={handleReset}
        confirmButtonText={resetMutation.isPending ? "Resetting…" : "Confirm"}
        isVisible={passwordVisible}
        setIsVisible={setPasswordVisible}
      />

      <ScrollView
        contentContainerClassName="p-4 pt-safe-offset-20 gap-y-10"
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View className="gap-y-3">
          <ThemedText className="text-2xl font-mono-semibold">
            Forgot Transaction Pin
          </ThemedText>
          <ThemedText className="text-pretty text-xs leading-6 text-muted-foreground">
            We sent a 6-digit verification code to{" "}
            {maskedEmail ? (
              <ThemedText className="font-mono-semibold text-danger">
                {maskedEmail}
              </ThemedText>
            ) : null}
          </ThemedText>
        </View>

        <View className="gap-y-6">
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
                  placeholderProps={{
                    textStyle: {
                      textAlign: "center",
                      fontFamily: "mono-regular",
                    },
                  }}
                  maxLength={6}
                  keyboardOptions={{
                    keyboardType: "number",
                  }}
                  placeholder="000000"
                  textStyle={{
                    textAlign: "center",
                  }}
                />
              </Field>
            )}
          />
          <form.AppField
            name="newPin"
            children={(field) => (
              <field.PasswordField
                label="New Pin"
                keyboardOptions={{
                  keyboardType: "numberPassword",
                }}
                maxLength={6}
              />
            )}
          />
          <form.AppField
            name="confirmPin"
            children={(field) => (
              <field.PasswordField
                label="Confirm Pin"
                keyboardOptions={{
                  keyboardType: "numberPassword",
                }}
                maxLength={6}
              />
            )}
          />
        </View>

        <View className="gap-y-3">
          <GhostButton
            onPress={handleResend}
            disabled={resendMutation.isPending}
          >
            <GhostButton.Label className="font-mono-medium uppercase">
              RESEND
            </GhostButton.Label>
            {resendMutation.isPending && (
              <ActivityIndicator colorClassName="accent-primary" />
            )}
          </GhostButton>
          <form.SubmitButton>
            <PrimaryButton.Label>Confirm Pin</PrimaryButton.Label>
          </form.SubmitButton>
        </View>
        <AnimatedSpacer height={100} />
      </ScrollView>
    </form.AppForm>
  );
};

export default ForgotTransactionPinScreen;
