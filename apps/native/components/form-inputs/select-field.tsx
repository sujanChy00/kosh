import { useFieldContext } from "@/contexts/form-context";
import { Field, FieldDescription, FieldError, FieldLabel } from "../ui/field";
import { SelectInput } from "../ui/select-input";
import { FormInputBaseProps } from "./types";

interface SelectFieldProps {
  options: { label: string; value: string }[];
  className?: string;
  onValueChange?: (value: string) => void;
}

export const SelectField = ({
  options,
  label,
  className,
  description,
  onValueChange,
  inputClassName,
  isDisabled,
}: FormInputBaseProps<SelectFieldProps>) => {
  const field = useFieldContext<string | undefined>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const fieldError = field.state.meta.errors?.[0];

  return (
    <Field className={className}>
      {!!label && (
        <FieldLabel isDisabled={isDisabled} isInvalid={isInvalid}>
          {label}
        </FieldLabel>
      )}
      <SelectInput
        className={inputClassName}
        disabled={isDisabled}
        onValueChange={(v) => {
          field.handleChange(v.toString());
          onValueChange?.(v.toString());
        }}
        value={field.state.value ?? ""}
        options={options}
      />
      {!!description && <FieldDescription>{description}</FieldDescription>}
      {!!fieldError?.message && <FieldError>{fieldError?.message}</FieldError>}
    </Field>
  );
};
