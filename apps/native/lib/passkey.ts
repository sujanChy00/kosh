import { PASSKEY_ERROR_CODES } from "@better-auth/passkey/client";
import { LOGIN_BIOMETRIC_ENABLED } from "@kosh-app/utils/constants/data";
import * as Device from "expo-device";

import { authClient } from "@/lib/auth-client";
import { storage } from "@/utils/storage";

/**
 * Result of a passkey operation. `cancelled` distinguishes a user dismissing
 * the native biometric prompt (not an error) from a real failure.
 */
export type PasskeyOperationResult =
  { ok: true } | { ok: false; cancelled: boolean; message?: string };

const PASSKEY_CANCELLED_CODES = new Set<string>([
  PASSKEY_ERROR_CODES.AUTH_CANCELLED.code,
  PASSKEY_ERROR_CODES.REGISTRATION_CANCELLED.code,
]);

export const isPasskeyCancelled = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const { code } = error as { code?: unknown };
  return typeof code === "string" && PASSKEY_CANCELLED_CODES.has(code);
};

const toFailure = (error: {
  message?: string;
  code?: string;
}): PasskeyOperationResult =>
  isPasskeyCancelled(error)
    ? { ok: false, cancelled: true }
    : { ok: false, cancelled: false, message: error.message };

/** Human-readable name for the passkey, e.g. "Apple iPhone 14 Pro". */
export const getPasskeyDeviceName = () =>
  [Device.brand, Device.modelName].filter(Boolean).join(" ") || "This device";

/**
 * Register a passkey for the signed-in user so they can sign in with the
 * platform biometric prompt. Mirrors the local "enabled" flag on success.
 */
export const registerPasskey = async (): Promise<PasskeyOperationResult> => {
  const registration = await authClient.passkey.addPasskey({
    name: getPasskeyDeviceName(),
  });
  if (registration.error) return toFailure(registration.error);

  storage.set(LOGIN_BIOMETRIC_ENABLED, true);
  await authClient
    .updateUser({ biometricEnabled: true })
    .catch(() => undefined);
  return { ok: true };
};

/**
 * Delete every passkey registered to the signed-in user, disabling biometric
 * login on all of this account's devices.
 */
export const removeAllPasskeys = async (): Promise<PasskeyOperationResult> => {
  try {
    const list = await authClient.passkey.listUserPasskeys();
    for (const passkey of list.data ?? []) {
      const deletion = await authClient.passkey.deletePasskey({
        id: passkey.id,
      });
      if (deletion.error) return toFailure(deletion.error);
    }

    storage.set(LOGIN_BIOMETRIC_ENABLED, false);
    await authClient
      .updateUser({ biometricEnabled: false })
      .catch(() => undefined);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      cancelled: false,
      message: error instanceof Error ? error.message : undefined,
    };
  }
};

/**
 * Sign in with a previously registered passkey using the platform biometric
 * prompt. Requires no email/password — the passkey identifies the user.
 */
export const signInWithPasskey = async (): Promise<PasskeyOperationResult> => {
  const authentication = await authClient.signIn.passkey();
  if (authentication.error) return toFailure(authentication.error);
  return { ok: true };
};
