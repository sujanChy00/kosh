import { useAppTheme } from "@/contexts/app-theme-context";
import { Host as UIHost } from "@expo/ui";
export const Host = (props: React.ComponentProps<typeof UIHost>) => {
  const { currentTheme } = useAppTheme();
  return <UIHost colorScheme={currentTheme} {...props} />;
};
