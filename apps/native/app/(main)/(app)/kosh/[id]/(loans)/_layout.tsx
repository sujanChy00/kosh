import { TopTabs } from "expo-router/js-top-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCSSVariable } from "uniwind";

const KoshLoanLayout = () => {
  const { top } = useSafeAreaInsets();
  const [primaryColor, foregroundColor] = useCSSVariable([
    "--color-primary",
    "--color-foreground",
  ]) as [string, string];
  return (
    <TopTabs
      screenOptions={{
        lazy: true,
        tabBarInactiveTintColor: foregroundColor,
        tabBarStyle: {
          paddingTop: top,
        },
        tabBarIndicatorStyle: {
          backgroundColor: primaryColor,
        },

        tabBarActiveTintColor: primaryColor,
      }}
    >
      <TopTabs.Screen
        name="all-loans"
        options={{
          title: "All",
        }}
      />
      <TopTabs.Screen
        name="active-loans"
        options={{
          title: "Active",
        }}
      />
      <TopTabs.Screen
        name="pending-loans"
        options={{
          title: "Pending",
        }}
      />
      <TopTabs.Screen
        name="paid-loans"
        options={{
          title: "Paid",
        }}
      />
    </TopTabs>
  );
};

export default KoshLoanLayout;
