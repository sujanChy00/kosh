import { useForm } from "@tanstack/react-form";

import { useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import z from "zod";

import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/trpc";

const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Use at least 8 characters"),
});

function getErrorMessage(error: unknown): string | null {
  if (!error) return null;

  if (typeof error === "string") {
    return error;
  }

  if (Array.isArray(error)) {
    for (const issue of error) {
      const message = getErrorMessage(issue);
      if (message) {
        return message;
      }
    }
    return null;
  }

  if (typeof error === "object" && error !== null) {
    const maybeError = error as { message?: unknown };
    if (typeof maybeError.message === "string") {
      return maybeError.message;
    }
  }

  return null;
}

function SignIn() {
  const passwordInputRef = useRef<TextInput>(null);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: signInSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      await authClient.signIn.email(
        {
          email: value.email.trim(),
          password: value.password,
        },
        {
          onError(error) {
            Alert.alert(error.error?.message || "Failed to sign in");
          },
          onSuccess() {
            formApi.reset();
            Alert.alert("Signed in successfully");
            queryClient.refetchQueries();
          },
        },
      );
    },
  });

  return (
    <View className="p-4 rounded-lg">
      <Text className="text-foreground font-medium mb-4">Sign In</Text>

      <form.Subscribe
        selector={(state) => ({
          isSubmitting: state.isSubmitting,
          validationError: getErrorMessage(state.errorMap.onSubmit),
        })}
      >
        {({ isSubmitting, validationError }) => {
          const formError = validationError;

          return (
            <>
              <Text className="mb-3">{formError}</Text>

              <View className="gap-3">
                <form.Field name="email">
                  {(field) => (
                    <TextInput
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChangeText={field.handleChange}
                      placeholder="email@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      textContentType="emailAddress"
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => {
                        passwordInputRef.current?.focus();
                      }}
                    />
                  )}
                </form.Field>

                <form.Field name="password">
                  {(field) => (
                    <TextInput
                      ref={passwordInputRef}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChangeText={field.handleChange}
                      placeholder="••••••••"
                      secureTextEntry
                      autoComplete="password"
                      textContentType="password"
                      returnKeyType="go"
                      onSubmitEditing={form.handleSubmit}
                    />
                  )}
                </form.Field>

                <Pressable
                  onPress={form.handleSubmit}
                  disabled={isSubmitting}
                  className="mt-1"
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" />
                  ) : (
                    <Text>Sign In</Text>
                  )}
                </Pressable>
              </View>
            </>
          );
        }}
      </form.Subscribe>
    </View>
  );
}

export { SignIn };
