import { ThemedText } from "@/components/themed-text";
import { AnimatedSpacer } from "@/components/ui/animated-spacer";
import { PrimaryButton } from "@/components/ui/button";
import { isIOS } from "@/constants/platform";
import {
  UPDATE_PASSWORD_FORM_VALUE,
  UPDATE_PASSWORD_SCHEMA,
} from "@/form/auth/auth-schema";
import { useForm } from "@/hooks/use-form";
import { useHaptics } from "@/hooks/use-haptics";
import { authClient } from "@/lib/auth-client";
import { errorToast, successToast } from "@/utils/toast";
import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

const UpdatePasswordScreen = () => {
  const router = useRouter();
  const haptics = useHaptics();
  const form = useForm({
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    } satisfies UPDATE_PASSWORD_FORM_VALUE,
    validators: {
      onSubmit: UPDATE_PASSWORD_SCHEMA,
    },
    onSubmitInvalid: () => {
      haptics("error");
    },
    onSubmit: async ({ value }) => {
      await authClient.changePassword(
        {
          currentPassword: value.current_password,
          newPassword: value.new_password,
        },
        {
          onError(error) {
            haptics("error");
            errorToast({
              title: error.error?.message || "Failed to update password",
            });
          },
          onSuccess() {
            form.reset();
            haptics("success");
            successToast({ title: "Password updated successfully" });
            router.back();
          },
        },
      );
    },
  });

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
        <form.AppForm>
          <View className="px-4 gap-y-6 pt-6">
            <ThemedText className="text-xs font-mono-semibold uppercase tracking-[0.2em] text-primary pb-6">
              Keep your account secure
            </ThemedText>
            <form.AppField
              name="current_password"
              children={(field) => (
                <field.PasswordField
                  label="Current Password"
                  placeholder="********"
                />
              )}
            />
            <form.AppField
              name="new_password"
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
                  label="Confirm New Password"
                  placeholder="********"
                />
              )}
            />
            <form.SubmitButton>
              <PrimaryButton.Label>Update Password</PrimaryButton.Label>
            </form.SubmitButton>
          </View>
        </form.AppForm>
        <AnimatedSpacer height={100} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default UpdatePasswordScreen;
