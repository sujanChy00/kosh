import { useFieldContext } from "@/contexts/form-context";
import { DateInput, DateInputProps } from "../ui/date-input";
import { Field, FieldDescription, FieldError, FieldLabel } from "../ui/field";
import { FormInputBaseProps } from "./types";

interface DateFieldProps extends Omit<
  FormInputBaseProps<DateInputProps>,
  "value" | "onChange"
> {}

export const DateField = ({
  label,
  isDisabled = false,
  description,
  inputClassName,
  className,
  placeholder,
  maximumDate,
  minimumDate,
}: DateFieldProps) => {
  const field = useFieldContext<Date | undefined>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const fieldError = field.state.meta.errors?.[0];

  return (
    <Field className={className}>
      {!!label && (
        <FieldLabel isDisabled={isDisabled} isInvalid={isInvalid}>
          {label}
        </FieldLabel>
      )}
      <DateInput
        isDisabled={isDisabled}
        placeholder={placeholder}
        value={field.state.value}
        className={inputClassName}
        onChange={field.handleChange}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
      />
      {!!description && <FieldDescription>{description}</FieldDescription>}
      {!!fieldError?.message && <FieldError>{fieldError?.message}</FieldError>}
    </Field>
  );
};
