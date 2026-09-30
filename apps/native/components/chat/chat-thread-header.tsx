import { useAppTheme } from "@/contexts/app-theme-context";
import { useChatThreadView } from "@/contexts/chat-thread-context";
import ARROW_LEFT from "@expo/material-symbols/arrow_left_alt.xml";
import ATTACH_FILE_ICON from "@expo/material-symbols/attach_file.xml";
import MEMBERS_ICON from "@expo/material-symbols/group.xml";
import INFO_ICON from "@expo/material-symbols/info.xml";
import MORE_HORIZ_ICON from "@expo/material-symbols/more_horiz.xml";
import {
  DropdownMenu,
  DropdownMenuItem,
  Icon,
  IconButton,
  Row,
  Text,
  TextButton,
} from "@expo/ui/jetpack-compose";
import {
  fillMaxWidth,
  padding,
  weight,
} from "@expo/ui/jetpack-compose/modifiers";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Host } from "../layout/host";

/**
 * Native header for an open thread: the title, and - for kosh group chats only -
 * the menu that reaches the kosh page, its roster and its shared media.
 *
 * Direct messages get no toolbar. Every action in it is kosh-scoped, and a DM
 * has exactly two participants, so the roster behind "Members" would just be
 * the person already on screen.
 */
export const ChatThreadHeader = () => {
  const { colors, isDark } = useAppTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const { title, isGroup, koshId, isHistoryPending } = useChatThreadView();
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const router = useRouter();

  return (
    <View
      className="absolute top-0 pt-safe-offset-10 w-full z-20"
      style={{
        backgroundColor: isDark ? "#00000080" : "#FFFFFF80",
      }}
    >
      <Host
        matchContents={{ vertical: true }}
        style={{ width: "100%", backgroundColor: "transparent" }}
      >
        <Row
          verticalAlignment="center"
          horizontalArrangement={{ spacedBy: 10 }}
          modifiers={[fillMaxWidth(), padding(10, 0, 10, 0)]}
        >
          <IconButton onClick={router.back}>
            <Icon source={ARROW_LEFT} />
          </IconButton>
          <TextButton
            onClick={() => {
              if (isHistoryPending || !isGroup) return;
              router.push({
                pathname: "/kosh/[id]",
                params: {
                  id: koshId,
                },
              });
            }}
            modifiers={[weight(1)]}
          >
            <Text
              overflow="ellipsis"
              maxLines={1}
              color={colors.text}
              style={{
                textAlign: "center",
                fontFamily: "notosans-medium",
              }}
            >
              {isHistoryPending ? "Loading..." : title}
            </Text>
          </TextButton>
          {!isHistoryPending && isGroup && (
            <DropdownMenu
              expanded={isExpanded}
              onDismissRequest={() => setIsExpanded(false)}
            >
              <DropdownMenu.Trigger>
                <IconButton onClick={() => setIsExpanded(true)}>
                  <Icon tint={colors.text} source={MORE_HORIZ_ICON} size={24} />
                </IconButton>
              </DropdownMenu.Trigger>
              <DropdownMenu.Items>
                <DropdownMenuItem
                  onClick={() => {
                    router.push({
                      pathname: "/kosh/[id]",
                      params: { id: koshId },
                    });
                    setIsExpanded(false);
                  }}
                >
                  <DropdownMenuItem.Text>
                    <Text>Kosh Details</Text>
                  </DropdownMenuItem.Text>
                  <DropdownMenuItem.LeadingIcon>
                    <Icon source={INFO_ICON} size={24} />
                  </DropdownMenuItem.LeadingIcon>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    router.push({
                      pathname: "/chat/[threadId]/members",
                      params: { threadId, koshId },
                    });
                    setIsExpanded(false);
                  }}
                >
                  <DropdownMenuItem.Text>
                    <Text>Members</Text>
                  </DropdownMenuItem.Text>
                  <DropdownMenuItem.LeadingIcon>
                    <Icon source={MEMBERS_ICON} size={24} />
                  </DropdownMenuItem.LeadingIcon>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    router.push({
                      pathname: "/chat/[threadId]/attachments",
                      params: { threadId },
                    });
                    setIsExpanded(false);
                  }}
                >
                  <DropdownMenuItem.Text>
                    <Text>Attachments</Text>
                  </DropdownMenuItem.Text>
                  <DropdownMenuItem.LeadingIcon>
                    <Icon source={ATTACH_FILE_ICON} size={24} />
                  </DropdownMenuItem.LeadingIcon>
                </DropdownMenuItem>
              </DropdownMenu.Items>
            </DropdownMenu>
          )}
        </Row>
      </Host>
    </View>
  );
};
