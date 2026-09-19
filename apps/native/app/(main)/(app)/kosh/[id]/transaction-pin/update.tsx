import { TransactionPinPasswordDialog } from "@/components/kosh/transaction-pin/transaction-pin-password-dialog";
import { ThemedText } from "@/components/themed-text";
import { AnimatedSpacer } from "@/components/ui/animated-spacer";
import { useAppTheme } from "@/contexts/app-theme-context";
import {
  TRANSACTION_PIN_FORM_VALUES,
  transactionPinSchema,
} from "@/form/kosh/transaction-pin-schema";
import { useForm } from "@/hooks/use-form";
import { useHaptics } from "@/hooks/use-haptics";
import { errorToast, successToast } from "@/utils/toast";
import { queryClient, trpc } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";

const UpdateTransactionPinScreen = () => {
  const haptics = useHaptics();
  const router = useRouter();
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{ id: string }>();
  const koshId = params.id;
  const [isVisible, setIsVisible] = useState(false);
  const form = useForm({
    defaultValues: {
      newPin: "",
      oldPin: "",
      confirmPin: "",
    } satisfies TRANSACTION_PIN_FORM_VALUES,
    validators: {
      onSubmit: transactionPinSchema,
    },

    onSubmit: () => {
      setIsVisible(true);
    },
    onSubmitInvalid: () => {
      haptics("error");
    },
  });

  const { updateMutation, handleUpdate } = (() => {
    const updateMutation = useMutation(
      trpc.kosh.updateTransactionPin.mutationOptions({
        onSuccess: () => {
          haptics("success");
          successToast({ title: "Transaction PIN updated" });
          setIsVisible(false);
          queryClient.invalidateQueries({
            queryKey: trpc.kosh.getById.queryKey({ koshId }),
          });
          router.back();
        },
        onError: (error) => {
          haptics("error");
          errorToast({ title: error.message || "Failed to update PIN" });
        },
      }),
    );

    const handleUpdate = (password: string) => {
      const { oldPin, newPin } = form.store.state.values;
      updateMutation.mutate({
        koshId,
        oldPin,
        newPin,
        password,
      });
    };
    return { updateMutation, handleUpdate };
  })();

  const { forgotMutation, handleForgot } = (() => {
    const forgotMutation = useMutation(
      trpc.kosh.requestTransactionPinReset.mutationOptions({
        onSuccess: (data) => {
          haptics("success");
          successToast({ title: "Reset code sent" });
          router.push({
            pathname: "/kosh/[id]/transaction-pin/forgot",
            params: { id: koshId, email: data.maskedEmail },
          });
        },
        onError: (error) => {
          haptics("error");
          errorToast({
            title: error.message || "Failed to send the reset code",
          });
        },
      }),
    );

    const handleForgot = () => {
      if (forgotMutation.isPending) return;
      forgotMutation.mutate({ koshId });
    };
    return { forgotMutation, handleForgot };
  })();

  return (
    <form.AppForm>
      <TransactionPinPasswordDialog
        onConfirm={handleUpdate}
        confirmButtonText={updateMutation.isPending ? "Updating…" : "Update"}
        isVisible={isVisible}
        setIsVisible={setIsVisible}
      />
      <ScrollView
        contentContainerClassName="px-4 pt-safe-offset-20 gap-y-10"
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <ThemedText className="text-2xl font-mono-semibold">
          Update Transaction Pin
        </ThemedText>
        <View className="gap-y-6">
          <form.AppField
            name="oldPin"
            children={(field) => (
              <field.PasswordField
                label="Old Pin"
                keyboardOptions={{
                  keyboardType: "numberPassword",
                }}
                maxLength={6}
              />
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
        <AnimatedSpacer height={400} />
      </ScrollView>
      <KeyboardStickyView
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 12,
          backgroundColor: colors.background,
        }}
        offset={{
          closed: -20,
          opened: -10,
        }}
      >
        <TouchableOpacity
          className="py-3"
          onPress={handleForgot}
          disabled={forgotMutation.isPending}
        >
          <ThemedText className="text-center">
            {forgotMutation.isPending ? "Sending…" : "Forgot Pin?"}
          </ThemedText>
        </TouchableOpacity>
        <form.SubmitButton disabled={forgotMutation.isPending}>
          <ThemedText className="text-primary-foreground">
            {updateMutation.isPending ? "Submitting…" : "Submit"}
          </ThemedText>
        </form.SubmitButton>
      </KeyboardStickyView>
    </form.AppForm>
  );
};

export default UpdateTransactionPinScreen;
