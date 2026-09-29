import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { NativeTabs } from "expo-router/native-tabs";

/**
 * Slower than the chat screen's own 3s poll on purpose: this keeps the badge
 * fresh enough for someone living on the Home tab, without every tab paying for
 * a message-level poll.
 */
const BADGE_POLL_INTERVAL_MS = 10000;

const TabLayout = () => {
  // Reads `chat.unreadTotal` rather than summing the thread list: the list is
  // paginated, so summing its loaded pages would undercount the badge for
  // anyone with more threads than fit on one screen. This is one count with no
  // row payload, so it stays cheap no matter how many threads exist.
  const unreadQuery = useQuery({
    ...trpc.chat.unreadTotal.queryOptions(),
    refetchInterval: BADGE_POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
  });

  const unread = unreadQuery.data ?? 0;

  return (
    <NativeTabs
      labelVisibilityMode="labeled"
      tintColor={"#0e5250"}
      indicatorColor={"#0e52504d"}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
          md={{ default: "home", selected: "home_filled" }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="my-loans">
        <NativeTabs.Trigger.Label>Loans</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "banknote", selected: "banknote.fill" }}
          md={{ default: "payments", selected: "payments" }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="chat">
        <NativeTabs.Trigger.Label>Chat</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "bubble", selected: "bubble.fill" }}
          md={{ default: "chat_bubble", selected: "chat_bubble" }}
        />
        {!!unread && (
          <NativeTabs.Trigger.Badge>
            {unread > 99 ? "99+" : String(unread)}
          </NativeTabs.Trigger.Badge>
        )}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="my-contribution">
        <NativeTabs.Trigger.Label>Contributions</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "receipt", selected: "receipt.fill" }}
          md={{ default: "receipt_long", selected: "receipt_long" }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="setting">
        <NativeTabs.Trigger.Label>Setting</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "gearshape", selected: "gearshape.fill" }}
          md={{ default: "settings", selected: "settings" }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
};

export default TabLayout;
