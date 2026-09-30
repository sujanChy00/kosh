import { useChatThreadView } from "@/contexts/chat-thread-context";
import ATTACH_FILE_ICON from "@expo/material-symbols/attach_file.xml";
import MEMBERS_ICON from "@expo/material-symbols/group.xml";
import INFO_ICON from "@expo/material-symbols/info.xml";
import MORE_HORIZ_ICON from "@expo/material-symbols/more_horiz.xml";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

/**
 * Native header for an open thread: the title, and - for kosh group chats only -
 * the menu that reaches the kosh page, its roster and its shared media.
 *
 * Direct messages get no toolbar. Every action in it is kosh-scoped, and a DM
 * has exactly two participants, so the roster behind "Members" would just be
 * the person already on screen.
 */
export const ChatThreadHeader = () => {
  const { title, isGroup, koshId, isHistoryPending } = useChatThreadView();
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const router = useRouter();

  return (
    <>
      <Stack.Title>{isHistoryPending ? "Loading..." : title}</Stack.Title>
      {!isHistoryPending && isGroup && (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Menu>
            <Stack.Toolbar.Icon sf="ellipsis.circle" src={MORE_HORIZ_ICON} />
            <Stack.Toolbar.MenuAction
              icon={INFO_ICON}
              onPress={() => {
                router.push({
                  pathname: "/kosh/[id]",
                  params: { id: koshId },
                });
              }}
            >
              Kosh details
            </Stack.Toolbar.MenuAction>
            <Stack.Toolbar.MenuAction
              icon={MEMBERS_ICON}
              onPress={() => {
                router.push({
                  pathname: "/chat/[threadId]/members",
                  params: { threadId, koshId },
                });
              }}
            >
              Members
            </Stack.Toolbar.MenuAction>
            <Stack.Toolbar.MenuAction
              icon={ATTACH_FILE_ICON}
              onPress={() => {
                router.push({
                  pathname: "/chat/[threadId]/attachments",
                  params: { threadId },
                });
              }}
            >
              Attachments
            </Stack.Toolbar.MenuAction>
          </Stack.Toolbar.Menu>
        </Stack.Toolbar>
      )}
    </>
  );
};
