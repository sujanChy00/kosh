import { useFieldContext } from "@/contexts/form-context";
import { cn } from "@kosh-app/utils";
import { DateInput, DateInputProps } from "../ui/date-input";
import { Field, FieldError } from "../ui/field";
import { FormInputBaseProps } from "./types";

interface DateFieldProps extends Omit<
  FormInputBaseProps<DateInputProps>,
  "value" | "onChange"
> {}

export const DateField = ({
  isDisabled = false,
  className,
  ...rest
}: DateFieldProps) => {
  const field = useFieldContext<Date | undefined>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const fieldError = field.state.meta.errors?.[0];

  return (
    <Field className={cn("relative", className)}>
      <DateInput {...rest} isInvalid={isInvalid} isDisabled={isDisabled} />
      {!!fieldError?.message && <FieldError>{fieldError?.message}</FieldError>}
    </Field>
  );
};
