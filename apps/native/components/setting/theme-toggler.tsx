import { useAppTheme } from "@/contexts/app-theme-context";
import CHECK_ICON from "@expo/material-symbols/check_small.xml";
import CHEVRON_UP_DOWN from "@expo/material-symbols/unfold_more.xml";
import { Icon, ListItem, Text } from "@expo/ui";
import { DropdownMenu, DropdownMenuItem, Row } from "@expo/ui/jetpack-compose";
import { clickable } from "@expo/ui/jetpack-compose/modifiers";
import { useState } from "react";
import { useCSSVariable } from "uniwind";

export const ThemeToggler = () => {
  const [mutedColor] = useCSSVariable(["--color-muted"]) as [string];
  const { setTheme, currentTheme } = useAppTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <ListItem>
      <Text
        textStyle={{
          fontFamily: "notosans-regular",
          fontSize: 15,
        }}
      >
        Theme
      </Text>
      <ListItem.Trailing>
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
              <Text
                textStyle={{
                  fontSize: 14,
                  color: mutedColor,
                }}
              >
                {currentTheme}
              </Text>
              <Icon name={CHEVRON_UP_DOWN} size={18} color={"#2b7fff"} />
            </Row>
          </DropdownMenu.Trigger>
          <DropdownMenu.Items>
            <DropdownMenuItem
              onClick={() => {
                setTheme("light");
                setIsExpanded(false);
              }}
            >
              <DropdownMenuItem.Text>
                <Text>Light</Text>
              </DropdownMenuItem.Text>
              {currentTheme === "light" && (
                <DropdownMenuItem.TrailingIcon>
                  <Icon name={CHECK_ICON} />
                </DropdownMenuItem.TrailingIcon>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setTheme("dark");
                setIsExpanded(false);
              }}
            >
              <DropdownMenuItem.Text>
                <Text>Dark</Text>
              </DropdownMenuItem.Text>
              {currentTheme === "dark" && (
                <DropdownMenuItem.TrailingIcon>
                  <Icon name={CHECK_ICON} />
                </DropdownMenuItem.TrailingIcon>
              )}
            </DropdownMenuItem>
          </DropdownMenu.Items>
        </DropdownMenu>
      </ListItem.Trailing>
    </ListItem>
  );
};
