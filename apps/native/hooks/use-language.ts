import { useMMKVString } from "react-native-mmkv";

import { storage } from "@/utils/storage";
import { dictionary, DictionaryKey, LanguageKey } from "@kosh-app/language";
import { LANGUAGE_KEY } from "@kosh-app/utils/constants/data";

export const useLanguage = () => {
  const [language, setLan] = useMMKVString(LANGUAGE_KEY, storage);

  const t = (key: DictionaryKey) => {
    const lan = (language ?? "en") as LanguageKey;
    return dictionary[lan][key];
  };

  const setLanguage = (key: LanguageKey) => {
    setLan(key);
  };

  return { language, setLanguage, t };
};
