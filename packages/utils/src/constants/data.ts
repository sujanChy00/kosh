import type { LanguageKey } from "@kosh-app/language";

export const ONBOARDING_COMPLETED = "KOSH_ONBOARDING_COMPLETED";
export const LOGIN_BIOMETRIC_ENABLED = "KOSH_LOGIN_BIOMETRIC_ENABLED";
export const LANGUAGE_KEY = "KOSH_LANGUAGE";
export const THEME_KEY = "KOSH_THEME";

export const LANG_OPTIONS: {
  value: LanguageKey;
  flag: string;
  label: string;
}[] = [
  {
    value: "en",
    label: "English",
    flag: "🇺🇸",
  },
  {
    value: "ne",
    label: "नेपाली",
    flag: "🇳🇵",
  },
];

export const OTP_EXPIRY_SECONDS = 600;

// Valid due days for a kosh contribution cycle (1-28). Shared across
// surfaces (form select, web, filters) so the allowed range stays in one place.
export const DUE_DAY_OPTIONS: { label: string; value: string }[] = Array.from(
  { length: 28 },
  (_, i) => ({ label: String(i + 1), value: String(i + 1) }),
);
