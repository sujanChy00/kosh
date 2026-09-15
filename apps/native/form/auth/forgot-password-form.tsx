import { ThemedText } from "@/components/themed-text";
import { AnimatedSpacer } from "@/components/ui/animated-spacer";
import { GhostButton, PrimaryButton } from "@/components/ui/button";
import { FieldDescription } from "@/components/ui/field";
import { TextInput } from "@/components/ui/text-input";
import { useHaptics } from "@/hooks/use-haptics";
import { useScrollToBottomOnKeyboardVisible } from "@/hooks/use-scroll-to-bottom-on-keyboard-visible";
import { authClient } from "@/lib/auth-client";
import { errorToast, successToast } from "@/utils/toast";
import { queryClient } from "@/utils/trpc";
import EMAIL_ICON from "@expo/material-symbols/mail.xml";
import { Icon } from "@expo/ui/jetpack-compose";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const ForgotPasswordForm = () => {
  const { scrollViewRef } = useScrollToBottomOnKeyboardVisible();
  const { email: queryEmail } = useLocalSearchParams<{ email?: string }>();
  const router = useRouter();
  const haptics = useHaptics();
  const [email, setEmail] = useState(queryEmail ?? "");
  const { bottom } = useSafeAreaInsets();

  const handleSubmit = async () => {
    await authClient.emailOtp.requestPasswordReset(
      { email: email.trim() },
      {
        onError(error) {
          haptics("error");
          errorToast({
            title: error.error?.message || "Failed to send reset link",
          });
        },
        onSuccess() {
          queryClient.refetchQueries();
          haptics("success");
          successToast({ title: "Reset code sent! Check your email." });
          router.push({
            pathname: "/reset-password",
            params: { email: email.trim() },
          });
        },
      },
    );
  };

  return (
    <>
      <ScrollView
        ref={scrollViewRef}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        <View className="px-4 gap-y-10 pt-12">
          <View className="mb-8 gap-y-3">
            <ThemedText className="text-xs font-mono-semibold uppercase tracking-[0.2em] text-primary">
              Account recovery
            </ThemedText>
            <ThemedText className="text-balance text-3xl font-notosans-semibold leading-[1.08] tracking-tight">
              Forgot password?
            </ThemedText>
            <FieldDescription>
              We'll send a verification code to your email to confirm it's you.
            </FieldDescription>
          </View>
          <TextInput
            placeholder="you@example.com"
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            prefix={<Icon source={EMAIL_ICON} size={18} />}
            keyboardOptions={{
              keyboardType: "email",
            }}
          />
        </View>
        <AnimatedSpacer height={500} />
      </ScrollView>
      <KeyboardStickyView
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 16,
        }}
        offset={{
          opened: bottom - 20,
          closed: -16,
        }}
      >
        <View className="gap-y-3">
          <Link asChild href={"/sign-in"}>
            <GhostButton className="relative">
              <GhostButton.Label className="font-mono-medium uppercase">
                Back to Login
              </GhostButton.Label>
            </GhostButton>
          </Link>
          <PrimaryButton
            onPress={() => handleSubmit()}
            disabled={!email.trim()}
          >
            <PrimaryButton.Label>Send reset link</PrimaryButton.Label>
          </PrimaryButton>
        </View>
      </KeyboardStickyView>
    </>
  );
};
