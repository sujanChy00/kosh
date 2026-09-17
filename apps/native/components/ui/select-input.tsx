import { ScrollView, Text } from "@expo/ui";
import {
  BasicAlertDialog,
  Box,
  Button,
  Column,
  DropdownMenuItem,
  ExposedDropdownMenu,
  ExposedDropdownMenuBox,
  HorizontalDivider,
  OutlinedTextField,
  RadioButton,
  Row,
  Surface,
  TextButton,
  useNativeState,
} from "@expo/ui/jetpack-compose";
import {
  align,
  clickable,
  clip,
  fillMaxWidth,
  height,
  matchParentSize,
  menuAnchor,
  padding,
  selectable,
  Shapes,
  weight,
  wrapContentHeight,
  wrapContentWidth,
} from "@expo/ui/jetpack-compose/modifiers";
import { useCallback, useState } from "react";
import { StyleSheet } from "react-native";
import { useCSSVariable } from "uniwind";
import { Host } from "../layout/host";

interface SelectInputProps {
  options: { label: string; value: string; disabled?: boolean }[];
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  isInvalid?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  description?: string;
  presentation?: "dropdown" | "dialog";
  title?: string;
}

export const SelectInput = ({
  options,
  value,
  onValueChange,
  disabled = false,
  label,
  placeholder,
  isInvalid,
  description,
  prefix,
  suffix,
  presentation = "dropdown",
  title,
}: SelectInputProps) => {
  const [mutedForeground] = useCSSVariable(["--color-muted-foreground"]) as [
    string,
  ];
  const selectedValue = useNativeState(value ?? "");
  const [selectInputValue, setSelectInputValue] = useState(value ?? "");
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

  if (presentation === "dialog")
    return (
      <Host matchContents={{ vertical: true }} style={{ width: "100%" }}>
        <Box modifiers={[fillMaxWidth()]}>
          <OutlinedTextField
            isError={isInvalid}
            readOnly
            enabled={!disabled}
            value={selectedValue}
            modifiers={[fillMaxWidth()]}
          >
            {label && (
              <OutlinedTextField.Label>
                <Text textStyle={{ fontFamily: "notosans-regular" }}>
                  {label}
                </Text>
              </OutlinedTextField.Label>
            )}
            {prefix && (
              <OutlinedTextField.LeadingIcon>
                {prefix}
              </OutlinedTextField.LeadingIcon>
            )}
            {placeholder && (
              <OutlinedTextField.Placeholder>
                <Text>{placeholder}</Text>
              </OutlinedTextField.Placeholder>
            )}
            {suffix && (
              <OutlinedTextField.TrailingIcon>
                {suffix}
              </OutlinedTextField.TrailingIcon>
            )}
            {description && (
              <OutlinedTextField.SupportingText>
                <Text
                  textStyle={{
                    fontSize: 12,
                    fontFamily: "notosans-regular",
                    color: mutedForeground,
                  }}
                >
                  {description}
                </Text>
              </OutlinedTextField.SupportingText>
            )}
          </OutlinedTextField>

          <Box
            modifiers={[
              matchParentSize(),
              clickable(() => !disabled && setExpanded(true)),
            ]}
          />
        </Box>
        {expanded && (
          <BasicAlertDialog onDismissRequest={() => setExpanded(false)}>
            <Surface
              tonalElevation={6}
              modifiers={[
                wrapContentWidth(),
                wrapContentHeight(),
                clip(Shapes.RoundedCorner(28)),
              ]}
            >
              <Column>
                {title && (
                  <Box modifiers={[padding(16, 16, 16, 16)]}>
                    <Text
                      textStyle={{
                        fontSize: 20,
                        fontWeight: "600",
                        fontFamily: "notosans-regular",
                      }}
                    >
                      {title}
                    </Text>
                  </Box>
                )}
                <HorizontalDivider thickness={StyleSheet.hairlineWidth} />
                <ScrollView modifiers={[height(500)]}>
                  {options.map((opt) => (
                    <Row
                      key={opt.value}
                      verticalAlignment="center"
                      modifiers={[
                        fillMaxWidth(),
                        height(56),
                        selectable(
                          opt.value === selectInputValue,
                          () => setSelectInputValue(opt.value),
                          "radioButton",
                        ),
                        padding(16, 0, 16, 0),
                      ]}
                    >
                      <RadioButton selected={opt.value === selectInputValue} />
                      <Text modifiers={[padding(16, 0, 0, 0)]}>
                        {opt.label}
                      </Text>
                    </Row>
                  ))}
                </ScrollView>
                <HorizontalDivider thickness={StyleSheet.hairlineWidth} />
                <Row
                  modifiers={[align("end"), padding(16, 16, 16, 16)]}
                  verticalAlignment="center"
                >
                  <TextButton onClick={() => setExpanded(false)}>
                    <Text>Cancel</Text>
                  </TextButton>
                  <Button
                    onClick={() => {
                      selectedValue.value = selectInputValue;
                      handleOptionPress({ value: selectInputValue });
                    }}
                  >
                    <Text>Confirm</Text>
                  </Button>
                </Row>
              </Column>
            </Surface>
          </BasicAlertDialog>
        )}
      </Host>
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
          {prefix && (
            <OutlinedTextField.LeadingIcon>
              {prefix}
            </OutlinedTextField.LeadingIcon>
          )}
          {suffix && (
            <OutlinedTextField.TrailingIcon>
              {suffix}
            </OutlinedTextField.TrailingIcon>
          )}
          {description && (
            <OutlinedTextField.SupportingText>
              <Text
                textStyle={{
                  fontSize: 12,
                  fontFamily: "notosans-regular",
                  color: mutedForeground,
                }}
              >
                {description}
              </Text>
            </OutlinedTextField.SupportingText>
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
