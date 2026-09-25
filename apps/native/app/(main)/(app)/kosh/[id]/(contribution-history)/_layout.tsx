import { TopTabs } from "expo-router/js-top-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCSSVariable } from "uniwind";

const KoshContributionLayout = () => {
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
        name="all-contributions"
        options={{
          title: "All",
        }}
      />
      <TopTabs.Screen
        name="paid-contributions"
        options={{
          title: "Paid",
        }}
      />
      <TopTabs.Screen
        name="pending-contributions"
        options={{
          title: "Pending",
        }}
      />
      <TopTabs.Screen
        name="late-contributions"
        options={{
          title: "Late",
        }}
      />
    </TopTabs>
  );
};

export default KoshContributionLayout;
