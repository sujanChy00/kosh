import { PendingComponent } from "@/components/layout/pending-component";
import { ProfileImagePicker } from "@/components/setting/profile-image-picker";
import { StyledSymbolView } from "@/components/styled-symbol-view";
import { AnimatedSpacer } from "@/components/ui/animated-spacer";
import { PrimaryButton } from "@/components/ui/button";
import { FullScreenSpinner } from "@/components/ui/full-screen-spinner";
import { toast } from "@/components/ui/Toast/toast.store";
import { isIOS } from "@/constants/platform";
import {
  UPDATE_PROFILE_FORM_VALUE,
  UPDATE_PROFILE_SCHEMA,
} from "@/form/auth/auth-schema";
import { useForm } from "@/hooks/use-form";
import { useHaptics } from "@/hooks/use-haptics";
import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/trpc";
import { useSelector } from "@tanstack/react-form";
import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

const UpdateProfileScreen = () => {
  const router = useRouter();
  const haptics = useHaptics();
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  const form = useForm({
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      image: user?.image ?? "",
    } satisfies UPDATE_PROFILE_FORM_VALUE,
    validators: {
      onSubmit: UPDATE_PROFILE_SCHEMA,
    },
    onSubmitInvalid: () => {
      haptics("error");
    },
    onSubmit: async ({ value, formApi }) => {
      await authClient.updateUser(
        {
          name: value.name.trim(),
          image: value.image.trim() || undefined,
        },
        {
          onError(error) {
            haptics("error");
            toast.error(error.error?.message || "Failed to update profile");
          },
          onSuccess() {
            haptics("success");
            formApi.reset();
            queryClient.refetchQueries();
            toast.success("Profile updated successfully");
            router.back();
          },
        },
      );
    },
  });

  const { isSubmitting } = useSelector(form.store, (state) => ({
    isSubmitting: state.isSubmitting,
  }));

  if (isPending) return <PendingComponent />;

  return (
    <KeyboardAvoidingView
      behavior={isIOS ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <FullScreenSpinner isVisible={isSubmitting} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        contentContainerClassName="pt-12 pb-4 px-4"
      >
        <form.AppForm>
          <View className="gap-y-6">
            <form.AppField
              name="image"
              children={(field) => (
                <View className="items-center py-4">
                  <ProfileImagePicker
                    onValueChange={field.handleChange}
                    imagePickerOptions={{
                      shape: "oval",
                      allowsEditing: true,
                      aspect: [1, 1],
                    }}
                    alt={user?.name}
                    source={field.state.value}
                  />
                </View>
              )}
            />
            <form.AppField
              name="name"
              children={(field) => (
                <field.TextField
                  accessibilityLabel="Full Name"
                  prefix={
                    <StyledSymbolView
                      name={{
                        android: "person",
                        ios: "person",
                      }}
                      tintColorClassName="accent-muted"
                      size={18}
                    />
                  }
                  label="Full Name"
                  placeholder={"Your name here"}
                  autoCapitalize="words"
                />
              )}
            />
            <form.AppField
              name="email"
              children={(field) => (
                <field.TextField
                  accessibilityLabel="Email Address"
                  isDisabled
                  prefix={
                    <StyledSymbolView
                      name={{
                        android: "email",
                        ios: "envelope",
                      }}
                      tintColorClassName="accent-muted"
                      size={18}
                    />
                  }
                  label="Email address"
                  keyboardType="email-address"
                />
              )}
            />
            <form.SubmitButton>
              <PrimaryButton.Label>Update Profile</PrimaryButton.Label>
            </form.SubmitButton>
          </View>
        </form.AppForm>
        <AnimatedSpacer height={100} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default UpdateProfileScreen;
