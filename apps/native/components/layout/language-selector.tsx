import { useLanguage } from "@/hooks/use-language";
import CHECK_ICON from "@expo/material-symbols/check_small.xml";
import CHEVRON_UP_DOWN from "@expo/material-symbols/unfold_more.xml";
import { Icon, Text, UniversalTextStyle } from "@expo/ui";
import { DropdownMenu, DropdownMenuItem, Row } from "@expo/ui/jetpack-compose";
import { clickable } from "@expo/ui/jetpack-compose/modifiers";
import { LANG_OPTIONS } from "@kosh-app/utils/constants/data";
import { useState } from "react";

interface Props {
  withIcon?: boolean;
  textStyle?: UniversalTextStyle;
  toLowerCase?: boolean;
}

export const LanguageSelector = ({
  withIcon = false,
  textStyle,
  toLowerCase = false,
}: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { language, setLanguage } = useLanguage();
  const selectedLanguage =
    LANG_OPTIONS.find((l) => l.value === language)?.label ?? "English";

  return (
    <DropdownMenu
      expanded={isExpanded}
      onDismissRequest={() => setIsExpanded(false)}
    >
      <DropdownMenu.Trigger>
        <Row
          verticalAlignment="center"
          modifiers={[
            clickable(() => {
              setIsExpanded(true);
            }),
          ]}
        >
          <Text textStyle={textStyle}>
            {toLowerCase ? selectedLanguage.toLowerCase() : selectedLanguage}
          </Text>
          {withIcon && (
            <Icon name={CHEVRON_UP_DOWN} size={18} color={"#2b7fff"} />
          )}
        </Row>
      </DropdownMenu.Trigger>
      <DropdownMenu.Items>
        {LANG_OPTIONS.map((lang) => (
          <DropdownMenuItem
            key={lang.value}
            onClick={() => {
              setLanguage(lang.value);
              setIsExpanded(false);
            }}
          >
            <DropdownMenuItem.Text>
              <Text>{lang.label}</Text>
            </DropdownMenuItem.Text>
            {lang.value === language && (
              <DropdownMenuItem.TrailingIcon>
                <Icon name={CHECK_ICON} />
              </DropdownMenuItem.TrailingIcon>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenu.Items>
    </DropdownMenu>
  );
};
