export type LanguageKey = "en" | "ne";

const dictionary_keys = [
  "continue",
  "login",
  "sign_in",
  "register",
  "forgot_password",
] as const;

export type DictionaryKey = (typeof dictionary_keys)[number];
