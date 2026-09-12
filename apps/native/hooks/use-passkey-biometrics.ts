import * as LocalAuthentication from "expo-local-authentication";
import { useCallback, useEffect, useState } from "react";
import { useMMKVBoolean } from "react-native-mmkv";

import { registerPasskey, removeAllPasskeys } from "@/lib/passkey";
import { storage } from "@/utils/storage";
import { errorToast, successToast } from "@/utils/toast";
import { LOGIN_BIOMETRIC_ENABLED } from "@kosh-app/utils/constants/data";
import { useHaptics } from "./use-haptics";

type BiometricAvailability = "checking" | "available" | "unavailable";

const ENABLED_MESSAGE = "Biometric login enabled for this device.";
const DISABLED_MESSAGE = "Biometric login disabled.";
const FAILED_ENABLE_MESSAGE = "Could not enable biometric login.";
const FAILED_DISABLE_MESSAGE = "Could not disable biometric login.";

/**
 * Owns the state and mutations behind the Settings → Biometric Login switch.
 * The switch reflects the LOCAL device flag (MMKV) — the same source of truth
 * used by the login form to decide whether to show the biometric button.
 * Passkeys are device-specific; a new device must register its own passkey
 * before biometric login works there.
 */
export const usePasskeyBiometrics = () => {
  const haptics = useHaptics();
  const [availability, setAvailability] =
    useState<BiometricAvailability>("checking");
  const [isPending, setIsPending] = useState(false);
  const [pendingValue, setPendingValue] = useState<boolean | null>(null);
  const [localEnabled] = useMMKVBoolean(LOGIN_BIOMETRIC_ENABLED, storage);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [hasHardware, isEnrolled] = await Promise.all([
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
        ]);
        if (isMounted) {
          setAvailability(
            hasHardware && isEnrolled ? "available" : "unavailable",
          );
        }
      } catch {
        if (isMounted) setAvailability("unavailable");
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const isAvailable = availability === "available";
  const isEnabled = pendingValue ?? !!localEnabled;

  const toggle = useCallback(
    async (enabled: boolean) => {
      if (isPending) return false;
      setIsPending(true);
      setPendingValue(enabled);
      let succeeded = false;
      try {
        const result = enabled
          ? await registerPasskey()
          : await removeAllPasskeys();
        if (!result.ok) {
          if (!result.cancelled) {
            haptics("error");
            errorToast({
              title:
                result.message ??
                (enabled ? FAILED_ENABLE_MESSAGE : FAILED_DISABLE_MESSAGE),
            });
          }
          return false;
        }
        haptics("success");
        successToast({ title: enabled ? ENABLED_MESSAGE : DISABLED_MESSAGE });
        succeeded = true;
        return true;
      } catch (error) {
        haptics("error");
        errorToast({
          title:
            error instanceof Error ? error.message : "Something went wrong.",
        });
        return false;
      } finally {
        if (!succeeded) setPendingValue(null);
        setIsPending(false);
      }
    },
    [haptics, isPending],
  );

  return {
    isAvailable,
    isEnabled,
    isPending,
    toggle,
  };
};
