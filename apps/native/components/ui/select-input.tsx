import { Text } from "@expo/ui";
import {
  DropdownMenuItem,
  ExposedDropdownMenu,
  ExposedDropdownMenuBox,
  OutlinedTextField,
  useNativeState,
} from "@expo/ui/jetpack-compose";
import {
  fillMaxWidth,
  menuAnchor,
  weight,
} from "@expo/ui/jetpack-compose/modifiers";
import { useCallback, useState } from "react";
import { Host } from "../layout/host";

interface SelectInputProps {
  options: { label: string; value: string; disabled?: boolean }[];
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  isInvalid?: boolean;
}

export const SelectInput = ({
  options,
  value,
  onValueChange,
  disabled = false,
  label,
  placeholder,
  isInvalid,
}: SelectInputProps) => {
  const selectedValue = useNativeState(value ?? "");
  const [expanded, setExpanded] = useState(false);

  const onClose = useCallback(() => {
    setExpanded(false);
  }, []);

  const handleOptionPress = useCallback(
    (item: { value: string }) => {
      onValueChange?.(item.value);
      onClose();
    },
    [onValueChange, onClose],
  );

  return (
    <Host matchContents={{ vertical: true }} style={{ width: "100%" }}>
      <ExposedDropdownMenuBox
        expanded={expanded}
        onExpandedChange={setExpanded}
        modifiers={[fillMaxWidth()]}
      >
        <OutlinedTextField
          enabled={!disabled}
          value={selectedValue}
          isError={isInvalid}
          readOnly
          modifiers={[menuAnchor(), fillMaxWidth(), weight(1)]}
        >
          {label && (
            <OutlinedTextField.Label>
              <Text
                textStyle={{
                  fontFamily: "notosans-regular",
                }}
              >
                {label}
              </Text>
            </OutlinedTextField.Label>
          )}
          {placeholder && (
            <OutlinedTextField.Placeholder>
              <Text>{placeholder}</Text>
            </OutlinedTextField.Placeholder>
          )}
        </OutlinedTextField>
        <ExposedDropdownMenu
          expanded={expanded}
          onDismissRequest={() => setExpanded(false)}
        >
          {options.map((opt) => (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => {
                selectedValue.value = opt.label;
                handleOptionPress({ value: opt.value });
              }}
            >
              <DropdownMenuItem.Text>
                <Text>{opt.label}</Text>
              </DropdownMenuItem.Text>
            </DropdownMenuItem>
          ))}
        </ExposedDropdownMenu>
      </ExposedDropdownMenuBox>
    </Host>
  );
};
