import { ThemedText } from "@/components/themed-text";
import { AnimatedSpacer } from "@/components/ui/animated-spacer";
import { GhostButton, PrimaryButton } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { InputOTP } from "@/components/ui/otp-input";
import { TextSeparator } from "@/components/ui/text-separator";
import { isIOS } from "@/constants/platform";
import { Link, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

export const VerifyEmailForm = () => {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [verificationCode, setVerificationCode] = useState("");

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
            <ThemedText className="text-balance text-4xl font-notosans-semibold leading-[1.08] tracking-tight">
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
            <FieldLabel>Verification Code</FieldLabel>
            <InputOTP
              autoFocus
              value={verificationCode}
              onChangeText={setVerificationCode}
            />
          </Field>
          <View className="gap-y-3">
            <GhostButton className="relative">
              <GhostButton.Label className="font-mono-medium uppercase">
                RESEND
              </GhostButton.Label>
              {/* <ActivityIndicator colorClassName="accent-primary" size={"small"} /> */}
            </GhostButton>
            <PrimaryButton>
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
