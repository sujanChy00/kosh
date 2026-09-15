import { useFieldContext } from "@/contexts/form-context";
import { Field, FieldError } from "../ui/field";
import { TextInput, TextInputProps } from "../ui/text-input";
import { FormInputBaseProps } from "./types";

export const TextField = ({
  className,
  ...inputProps
}: FormInputBaseProps<TextInputProps> & {
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}) => {
  const field = useFieldContext<string | undefined>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const fieldError = field.state.meta.errors?.[0];

  return (
    <Field className={className}>
      <TextInput
        {...inputProps}
        value={field.state.value}
        onChangeText={field.handleChange}
        isInvalid={isInvalid}
      />
      {!!fieldError?.message && <FieldError>{fieldError?.message}</FieldError>}
    </Field>
  );
};
