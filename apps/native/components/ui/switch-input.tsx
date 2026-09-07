import { useHaptics } from "@/hooks/use-haptics";
import { Switch } from "@expo/ui";
import { View } from "react-native";
import { twMerge } from "tailwind-merge";
import { Host } from "../layout/host";
import { ThemedText } from "../themed-text";

export interface SwitchInputProps extends React.ComponentProps<typeof Switch> {
  className?: string;
  labelClassName?: string;
}

export const SwitchInput = ({
  onValueChange,
  label,
  labelClassName,
  className,
  ...rest
}: SwitchInputProps) => {
  const haptics = useHaptics();
  return (
    <View className={twMerge("flex-row items-center", className)}>
      {label && <ThemedText className={labelClassName}>{label}</ThemedText>}
      <Host matchContents>
        <Switch
          {...rest}
          onValueChange={(checked) => {
            haptics(checked ? "toggle-on" : "toggle-off");
            onValueChange(checked);
          }}
        />
      </Host>
    </View>
  );
};
