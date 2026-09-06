import { engish_dictionary } from "./en";
import { nepali_dictionary } from "./np";
import type { DictionaryKey, LanguageKey } from "./types";

export const dictionary: Record<LanguageKey, Record<DictionaryKey, string>> = {
  en: engish_dictionary,
  ne: nepali_dictionary,
};
