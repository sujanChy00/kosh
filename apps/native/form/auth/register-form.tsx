import { Host } from "@/components/layout/host";
import { StyledSymbolView } from "@/components/styled-symbol-view";
import { ThemedText } from "@/components/themed-text";
import { AnimatedSpacer } from "@/components/ui/animated-spacer";
import { isIOS } from "@/constants/platform";
import { useForm } from "@/hooks/use-form";
import { useHaptics } from "@/hooks/use-haptics";
import { Checkbox } from "@expo/ui";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { REGISTER_FORM_VALUE, REGISTER_SCHEMA } from "./auth-schema";

export const RegisterForm = () => {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const haptics = useHaptics();
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      confirm_password: "",
      name: "",
    } satisfies REGISTER_FORM_VALUE,
    validators: {
      onSubmit: REGISTER_SCHEMA,
    },
    onSubmitInvalid: () => {
      haptics("error");
    },
    onSubmit: ({ value }) => {
      router.push({
        pathname: "/verify-email",
        params: {
          email: value.email,
        },
      });
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
        <View className="mb-8 gap-y-3 px-4">
          <ThemedText className="text-xs font-mono-semibold uppercase tracking-[0.2em] text-primary">
            Start together
          </ThemedText>
          <ThemedText className="text-balance text-4xl font-notosans-semibold leading-[1.08] tracking-tight">
            Create your Kosh account.
          </ThemedText>
        </View>
        <View className="self-start flex-row items-center gap-1 border-b border-border w-full">
          <Link href={"/sign-in"} asChild>
            <TouchableOpacity className={"px-3 py-1.5 "}>
              <ThemedText className="font-notosans-medium text-muted">
                Sign in
              </ThemedText>
            </TouchableOpacity>
          </Link>
          <Link href={"/sign-up"} asChild>
            <TouchableOpacity
              className={
                "px-3 py-1.5 border-b-2 border-b-primary translate-y-px"
              }
            >
              <ThemedText className="font-notosans-bold text-primary">
                Register
              </ThemedText>
            </TouchableOpacity>
          </Link>
        </View>
        <form.AppForm>
          <View className="px-4 gap-y-6 pt-6">
            <form.AppField
              name="name"
              children={(field) => (
                <field.TextField
                  accessibilityLabel="User Name"
                  prefix={
                    <StyledSymbolView
                      name={{
                        android: "group",
                        ios: "person.3",
                      }}
                      tintColorClassName="accent-muted"
                      size={18}
                    />
                  }
                  label="Full Name"
                  placeholder="Your name here"
                />
              )}
            />
            <form.AppField
              name="email"
              children={(field) => (
                <field.TextField
                  accessibilityLabel="Email Address"
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
                  placeholder="user@example.com"
                />
              )}
            />
            <form.AppField
              name="password"
              children={(field) => (
                <field.PasswordField label="Password" placeholder="********" />
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
              <form.SubmitButton disabled={!accepted}>
                <ThemedText className="text-primary-foreground">
                  Create Account
                </ThemedText>
              </form.SubmitButton>
              <Host
                matchContents={{ vertical: true }}
                style={{ width: "100%" }}
              >
                <Checkbox
                  label="By creating an account, you agree to our Terms and Privacy Policy."
                  value={accepted}
                  onValueChange={setAccepted}
                />
              </Host>
            </View>

            <View className="flex-row items-center justify-center gap-1 pt-6">
              <StyledSymbolView
                size={16}
                tintColorClassName="accent-muted-foreground"
                name={{
                  android: "lock",
                }}
              />
              <ThemedText className="text-muted-foreground text-xs text-center">
                Your information is protected
              </ThemedText>
            </View>
          </View>
        </form.AppForm>
        <AnimatedSpacer height={100} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
