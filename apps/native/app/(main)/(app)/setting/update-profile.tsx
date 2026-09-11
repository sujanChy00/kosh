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
import { isRemoteImage, uploadToCloudinary } from "@/lib/cloudinary";
import { useSelector } from "@tanstack/react-form";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

const UpdateProfileScreen = () => {
  const router = useRouter();
  const haptics = useHaptics();
  const [isUploading, setIsUploading] = useState(false);
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
      let image = value.image.trim() || undefined;
      if (image && !isRemoteImage(image)) {
        setIsUploading(true);
        try {
          image = await uploadToCloudinary(image);
        } catch (error) {
          haptics("error");
          toast.error(
            error instanceof Error ? error.message : "Failed to upload image",
          );
          return;
        } finally {
          setIsUploading(false);
        }
      }
      await authClient.updateUser(
        {
          name: value.name.trim(),
          image,
        },
        {
          onError(error) {
            haptics("error");
            toast.error(error.error?.message || "Failed to update profile");
          },
          onSuccess() {
            haptics("success");
            formApi.reset();
            toast.success("Profile updated successfully");
            setTimeout(() => {
              router.back();
            }, 400);
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
      <FullScreenSpinner
        isVisible={isSubmitting || isUploading}
        loadingText={isUploading ? "Uploading image..." : undefined}
      />
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
