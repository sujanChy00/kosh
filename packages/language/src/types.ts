export type LanguageKey = "en" | "ne";

const dictionary_keys = ["continue"] as const;

export type DictionaryKey = (typeof dictionary_keys)[number];
