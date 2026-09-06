import { StyledSymbolView } from "@/components/styled-symbol-view";
import { ThemedText } from "@/components/themed-text";
import { AnimatedSpacer } from "@/components/ui/animated-spacer";
import { GhostButton, PrimaryButton } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { InputGroup } from "@/components/ui/input-group";
import { Link, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const ForgotPasswordForm = () => {
  const { email: queryEmail } = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(queryEmail ?? "");
  const { bottom } = useSafeAreaInsets();
  return (
    <>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        <View className="px-4 gap-y-10 pt-12">
          <View className="mb-8 gap-y-3">
            <ThemedText className="text-xs font-mono-semibold uppercase tracking-[0.2em] text-primary">
              Account recovery
            </ThemedText>
            <ThemedText className="text-balance text-3xl font-notosans-semibold leading-[1.08] tracking-tight">
              Reset your password.
            </ThemedText>
          </View>
          <Field>
            <FieldLabel>Email Address</FieldLabel>
            <InputGroup>
              <InputGroup.Prefix isDecorative className="pr-1">
                <StyledSymbolView
                  name={{
                    android: "email",
                    ios: "envelope",
                  }}
                  tintColorClassName="accent-muted"
                  size={18}
                />
              </InputGroup.Prefix>
              <InputGroup.Input
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                accessibilityLabel="Email Address"
                autoFocus={!!queryEmail ? false : true}
                placeholder="you@example.com"
              />
            </InputGroup>
          </Field>
        </View>
        <AnimatedSpacer height={120} />
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
          <PrimaryButton>
            <PrimaryButton.Label>Send reset link</PrimaryButton.Label>
          </PrimaryButton>
        </View>
      </KeyboardStickyView>
    </>
  );
};
