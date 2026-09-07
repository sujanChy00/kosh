import { expoClient } from "@better-auth/expo/client";
import { env } from "@kosh-app/env/native";
import { createAuthClient } from "better-auth/react";
import { emailOTPClient, inferAdditionalFields } from "better-auth/client/plugins";
import { expoPasskeyClient } from "expo-better-auth-passkey";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
  baseURL: env.EXPO_PUBLIC_SERVER_URL,
  plugins: [
    expoClient({
      scheme: Constants.expoConfig?.scheme as string,
      storagePrefix: Constants.expoConfig?.scheme as string,
      cookiePrefix: "kosh",
      storage: SecureStore,
    }),
    emailOTPClient(),
    inferAdditionalFields({ user: { biometricEnabled: { type: "boolean", required: false } } }),
    expoPasskeyClient(),
  ],
});
