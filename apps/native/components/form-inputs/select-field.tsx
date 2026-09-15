import { useFieldContext } from "@/contexts/form-context";
import { Field, FieldDescription, FieldError } from "../ui/field";
import { SelectInput } from "../ui/select-input";
import { FormInputBaseProps } from "./types";

interface SelectFieldProps {
  options: { label: string; value: string }[];
  className?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

export const SelectField = ({
  options,
  label,
  className,
  description,
  onValueChange,
  placeholder,
  disabled,
}: FormInputBaseProps<SelectFieldProps>) => {
  const field = useFieldContext<string | undefined>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const fieldError = field.state.meta.errors?.[0];

  return (
    <Field className={className}>
      <SelectInput
        onValueChange={(v) => {
          field.handleChange(v.toString());
          onValueChange?.(v.toString());
        }}
        value={field.state.value ?? ""}
        options={options}
        label={label}
        placeholder={placeholder}
        disabled={disabled}
        isInvalid={isInvalid}
      />
      {!!description && <FieldDescription>{description}</FieldDescription>}
      {!!fieldError?.message && <FieldError>{fieldError?.message}</FieldError>}
    </Field>
  );
};
