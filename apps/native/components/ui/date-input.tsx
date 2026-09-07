import DateTimePicker from "@expo/ui/community/datetime-picker";
import { formatShortDate } from "@kosh-app/utils/date";
import { useState } from "react";
import { SecondaryButton } from "./button";

export interface DateInputProps {
  placeholder?: string;
  value?: Date;
  onChange?: (date: Date) => void;
  className?: string;
  isDisabled?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
}

export function DateInput({
  placeholder,
  value,
  onChange,
  className,
  isDisabled,
  minimumDate,
  maximumDate,
}: DateInputProps) {
  const [date, setDate] = useState(value ?? new Date());
  const [show, setShow] = useState(false);

  return (
    <>
      <SecondaryButton
        className={className}
        onPress={() => setShow(true)}
        disabled={isDisabled}
      >
        <SecondaryButton.Label>
          {date ? formatShortDate(date) : placeholder}
        </SecondaryButton.Label>
      </SecondaryButton>
      {show && (
        <DateTimePicker
          value={date}
          onValueChange={(_, selectedDate) => {
            setShow(false);
            setDate(selectedDate);
            onChange?.(selectedDate);
          }}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onDismiss={() => {
            setShow(false);
          }}
          mode="date"
          presentation="dialog"
        />
      )}
    </>
  );
}
