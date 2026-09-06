import { StyledSymbolView } from "@/components/styled-symbol-view";
import { ThemedText } from "@/components/themed-text";
import { AnimatedSpacer } from "@/components/ui/animated-spacer";
import { SecondaryButton } from "@/components/ui/button";
import { Field, FieldDescription } from "@/components/ui/field";
import { FullScreenSpinner } from "@/components/ui/full-screen-spinner";
import { TextSeparator } from "@/components/ui/text-separator";
import { isIOS } from "@/constants/platform";
import { useForm } from "@/hooks/use-form";
import { useHaptics } from "@/hooks/use-haptics";
import { authClient } from "@/lib/auth-client";
import { storage } from "@/utils/storage";
import { ONBOARDING_COMPLETED } from "@kosh-app/utils/constants/data";
import { useSelector } from "@tanstack/react-form";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, TouchableOpacity, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { toast } from "sonner-native";
import { LOGIN_FORM_VALUE, LOGIN_SCHEMA } from "./auth-schema";

export const LoginForm = () => {
  const router = useRouter();
  const { email: emailQuery } = useLocalSearchParams<{ email?: string }>();
  const haptics = useHaptics();
  const form = useForm({
    defaultValues: {
      email: emailQuery ?? "",
      password: "",
    } satisfies LOGIN_FORM_VALUE,
    validators: {
      onSubmit: LOGIN_SCHEMA,
    },
    onSubmitInvalid: () => {
      haptics("error");
    },
    onSubmit: async ({ value, formApi }) => {
      await authClient.signIn.email(
        {
          email: value.email.trim(),
          password: value.password,
        },
        {
          async onError(error) {
            haptics("error");
            toast.error(error.error?.message || "Failed to sign in");
            if (error.error.code === "EMAIL_NOT_VERIFIED") {
              toast.info("Sending a verification code to your email...");
              await authClient.emailOtp.sendVerificationOtp(
                {
                  email: value.email.trim(),
                  type: "email-verification",
                },
                {
                  onSuccess() {
                    router.push({
                      pathname: "/verify-email",
                      params: {
                        email: value.email,
                      },
                    });
                  },
                },
              );
            }
          },
          onSuccess() {
            formApi.reset();
          },
        },
      );
    },
  });

  const { email, isSubmitting } = useSelector(form.store, (state) => ({
    email: state.values.email,
    isSubmitting: state.isSubmitting,
  }));

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
        contentContainerClassName="pt-12 pb-4"
      >
        <View className="mb-8 gap-y-3 px-4">
          <ThemedText className="text-xs font-mono-semibold uppercase tracking-[0.2em] text-primary">
            Welcome back
          </ThemedText>
          <ThemedText className="text-balance text-4xl font-notosans-semibold leading-[1.08] tracking-tight">
            Sign in to your kosh.
          </ThemedText>
        </View>
        <View className="self-start flex-row items-center gap-1 border-b border-border w-full">
          <Link href={"/sign-in"} asChild>
            <TouchableOpacity
              className={
                "px-3 py-1.5 border-b-2 border-b-primary translate-y-px"
              }
            >
              <ThemedText className="font-notosans-bold text-primary">
                Sign in
              </ThemedText>
            </TouchableOpacity>
          </Link>
          <Link href={"/sign-up"} asChild>
            <TouchableOpacity className="px-3 py-1.5">
              <ThemedText className="font-notosans-medium text-muted">
                Register
              </ThemedText>
            </TouchableOpacity>
          </Link>
        </View>
        <form.AppForm>
          <View className="px-4 gap-y-6 pt-6">
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
                <Field className="items-center">
                  <field.PasswordField
                    onSubmitEditing={() => {
                      form.handleSubmit();
                    }}
                    returnKeyType="done"
                    label="Password"
                    placeholder="********"
                  />
                  <Link
                    asChild
                    className="ml-auto pt-1"
                    href={{
                      pathname: "/forgot-password",
                      params: {
                        email,
                      },
                    }}
                  >
                    <Pressable hitSlop={10}>
                      <FieldDescription className="text-right">
                        Forgot Password?
                      </FieldDescription>
                    </Pressable>
                  </Link>
                </Field>
              )}
            />
            <form.SubmitButton>
              <ThemedText className="text-primary-foreground">Login</ThemedText>
            </form.SubmitButton>
            <View className="gap-y-3">
              <TextSeparator text="or continue with" />
              <SecondaryButton
                onPress={() => {
                  storage.remove(ONBOARDING_COMPLETED);
                }}
              >
                <StyledSymbolView
                  tintColorClassName={"accent-primary"}
                  name={{
                    ios: "faceid",
                    android: "fingerprint",
                  }}
                />
                <SecondaryButton.Label>
                  {isIOS ? "Login with FaceID" : "Login with Fingerprint"}
                </SecondaryButton.Label>
              </SecondaryButton>
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
