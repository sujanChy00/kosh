import { useAppTheme } from "@/contexts/app-theme-context";
import { useLanguage } from "@/hooks/use-language";
import { MenuView } from "@expo/ui/community/menu";
import { LanguageKey } from "@kosh-app/language";
import { LANG_OPTIONS } from "@kosh-app/utils/constants/data";

interface Props {
  children: (lan: string) => React.ReactNode;
}

export const LanguageSelector = ({ children }: Props) => {
  const { currentTheme } = useAppTheme();
  const { language, setLanguage } = useLanguage();
  const selectedLanguage =
    LANG_OPTIONS.find((l) => l.value === language)?.label ?? "English";
  return (
    <MenuView
      colorScheme={currentTheme}
      onPressAction={(e) => {
        setLanguage(e.nativeEvent.event as LanguageKey);
      }}
      actions={LANG_OPTIONS.map((opt) => ({
        title: opt.label,
        id: opt.value,
        state: opt.value === language ? "on" : "off",
      }))}
    >
      {children(selectedLanguage)}
    </MenuView>
  );
};
