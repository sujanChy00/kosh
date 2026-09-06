import type { LanguageKey } from "@kosh-app/language";

export const ONBOARDING_COMPLETED = "KOSH_ONBOARDING_COMPLETED";
export const BIOMETRIC_ENABLED = "KOSH_BIOMETRIC_ENABLED";
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
