import { storage } from "@/utils/storage";
import { ONBOARDING_COMPLETED } from "@kosh-app/utils";
import { useMMKVBoolean } from "react-native-mmkv";

export const useOnboarding = () => {
  const [value, setIsOnboardingCompleted] = useMMKVBoolean(
    ONBOARDING_COMPLETED,
    storage,
  );
  const isOnboardingCompleted = value ?? false;
  return {
    isOnboardingCompleted,
    setIsOnboardingCompleted,
  };
};
