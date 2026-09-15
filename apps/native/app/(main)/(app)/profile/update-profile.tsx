import { PendingComponent } from "@/components/layout/pending-component";
import { ProfileImagePicker } from "@/components/setting/profile-image-picker";
import { AnimatedSpacer } from "@/components/ui/animated-spacer";
import { PrimaryButton } from "@/components/ui/button";
import {
  UPDATE_PROFILE_FORM_VALUE,
  UPDATE_PROFILE_SCHEMA,
} from "@/form/auth/auth-schema";
import { useForm } from "@/hooks/use-form";
import { useHaptics } from "@/hooks/use-haptics";
import { authClient } from "@/lib/auth-client";
import { isRemoteImage, uploadToCloudinary } from "@/lib/cloudinary";
import { errorToast, successToast } from "@/utils/toast";
import MAIL_ICON from "@expo/material-symbols/mail.xml";
import PERSON_ICON from "@expo/material-symbols/person.xml";
import { Icon } from "@expo/ui/jetpack-compose";
import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";

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
      let image = value.image.trim() || undefined;
      if (image && !isRemoteImage(image)) {
        try {
          image = await uploadToCloudinary(image);
        } catch (error) {
          haptics("error");
          errorToast({
            title:
              error instanceof Error ? error.message : "Failed to upload image",
          });
          return;
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
            errorToast({
              title: error.error?.message || "Failed to update profile",
            });
          },
          onSuccess() {
            haptics("success");
            formApi.reset();
            successToast({
              title: "Profile updated successfully",
            });
            router.back();
          },
        },
      );
    },
  });

  if (isPending) return <PendingComponent />;

  return (
    <form.AppForm>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        contentContainerClassName="pt-12 pb-4 px-4"
      >
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
                prefix={<Icon size={18} source={PERSON_ICON} />}
                label="Full Name"
                placeholder={"Your name here"}
              />
            )}
          />
          <form.AppField
            name="email"
            children={(field) => (
              <field.TextField
                enabled={false}
                prefix={<Icon size={18} source={MAIL_ICON} />}
                label="Email address"
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
        }}
        offset={{
          closed: -20,
          opened: -10,
        }}
      >
        <form.SubmitButton>
          <PrimaryButton.Label>Update Profile</PrimaryButton.Label>
        </form.SubmitButton>
      </KeyboardStickyView>
    </form.AppForm>
  );
};

export default UpdateProfileScreen;
