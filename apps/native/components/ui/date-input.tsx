import { Text } from "@expo/ui";
import {
  Box,
  DatePickerDialog,
  OutlinedTextField,
  useNativeState,
} from "@expo/ui/jetpack-compose";
import {
  clickable,
  fillMaxWidth,
  matchParentSize,
} from "@expo/ui/jetpack-compose/modifiers";
import { formatShortDate } from "@kosh-app/utils/date";
import { useState } from "react";
import { Host } from "../layout/host";

export interface DateInputProps {
  placeholder?: string;
  value?: Date;
  onChange?: (date: Date) => void;
  isDisabled?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
  label?: string;
  isInvalid?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  description?: string;
}

export function DateInput({
  placeholder,
  value,
  onChange,
  isDisabled = false,
  minimumDate,
  maximumDate,
  label,
  isInvalid = false,
  prefix,
  suffix,
  description,
}: DateInputProps) {
  const [date, setDate] = useState<Date | undefined>(value ?? new Date());
  const dateValue = useNativeState(date ? formatShortDate(date) : "");
  const [show, setShow] = useState(false);

  return (
    <Host matchContents={{ vertical: true }} style={{ width: "100%" }}>
      <Box modifiers={[fillMaxWidth()]}>
        <OutlinedTextField
          isError={isInvalid}
          readOnly
          enabled={!isDisabled}
          value={dateValue}
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
            clickable(() => !isDisabled && setShow(true)),
          ]}
        />
      </Box>

      {show && (
        <DatePickerDialog
          onDismissRequest={() => setShow(false)}
          onDateSelected={(selectedDate) => {
            setDate(selectedDate);
            dateValue.value = formatShortDate(selectedDate);
            onChange?.(selectedDate);
            setShow(false);
          }}
          initialDate={date ? date.toISOString() : null}
          selectableDates={
            minimumDate || maximumDate
              ? { start: minimumDate!, end: maximumDate! }
              : undefined
          }
          variant="input"
        />
      )}
    </Host>
  );
}
