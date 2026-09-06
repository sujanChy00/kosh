import { useFieldContext } from "@/contexts/form-context";
import { Field, FieldDescription, FieldError, FieldLabel } from "../ui/field";
import { InputGroup } from "../ui/input-group";
import { TextInputProps } from "../ui/text-input";
import { FormInputBaseProps } from "./types";

export const TextField = ({
  label,
  isDisabled = false,
  description,
  inputClassName,
  className,
  prefix,
  suffix,
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
      {!!label && (
        <FieldLabel isDisabled={isDisabled} isInvalid={isInvalid}>
          {label}
        </FieldLabel>
      )}
      <InputGroup
        className="pr-0"
        isInvalid={isInvalid}
        isDisabled={isDisabled}
      >
        {prefix && (
          <InputGroup.Prefix className="pr-1" isDecorative>
            {prefix}
          </InputGroup.Prefix>
        )}
        <InputGroup.Input
          autoCapitalize="none"
          autoCorrect={false}
          {...inputProps}
          className={inputClassName}
          editable={!isDisabled}
          onBlur={field.handleBlur}
          value={String(field.state.value ?? "")}
          onChangeText={field.handleChange}
        />
        {suffix && <InputGroup.Suffix>{suffix}</InputGroup.Suffix>}
      </InputGroup>
      {!!description && <FieldDescription>{description}</FieldDescription>}
      {!!fieldError?.message && <FieldError>{fieldError?.message}</FieldError>}
    </Field>
  );
};
