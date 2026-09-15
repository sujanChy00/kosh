import { useHaptics } from "@/hooks/use-haptics";
import { Spacer, Switch, Text } from "@expo/ui";
import { Row } from "@expo/ui/jetpack-compose";
import { clickable } from "@expo/ui/jetpack-compose/modifiers";
import { Host } from "../layout/host";

export interface SwitchInputProps extends React.ComponentProps<typeof Switch> {
  className?: string;
  labelClassName?: string;
}

export const SwitchInput = ({
  value,
  onValueChange,
  label,
  labelClassName,
  className,
  ...rest
}: SwitchInputProps) => {
  const haptics = useHaptics();

  const toggle = () => {
    const next = !value;
    haptics(next ? "toggle-on" : "toggle-off");
    onValueChange(next);
  };

  return (
    <Host matchContents={{ vertical: true }} style={{ width: "100%" }}>
      <Row verticalAlignment="center" modifiers={[clickable(toggle)]}>
        {label && (
          <Text
            textStyle={{
              fontFamily: "notosans-regular",
            }}
          >
            {label}
          </Text>
        )}
        <Spacer flexible />
        <Switch {...rest} value={value} onValueChange={toggle} />
      </Row>
    </Host>
  );
};
