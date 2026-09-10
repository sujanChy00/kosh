import { NativeTabs } from "expo-router/unstable-native-tabs";

const TabLayout = () => {
  return (
    <NativeTabs labelVisibilityMode="labeled">
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
          md={{ default: "home", selected: "home_filled" }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="loan">
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
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="member">
        <NativeTabs.Trigger.Label>Members</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "person.2", selected: "person.2.fill" }}
          md={{ default: "group", selected: "group" }}
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
