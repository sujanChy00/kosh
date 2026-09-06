import { useFieldContext } from "@/contexts/form-context";
import { twMerge } from "tailwind-merge";
import { Field, FieldDescription } from "../ui/field";
import { SwitchInput, SwitchInputProps } from "../ui/switch-input";

interface Props extends Omit<SwitchInputProps, "onValueChange" | "value"> {
  description?: string;
  inputClassName?: string;
}

export const SwitchField = ({
  inputClassName,
  className,
  description,
  ...props
}: Props) => {
  const field = useFieldContext<boolean | undefined>();

  return (
    <Field className={className}>
      <SwitchInput
        {...props}
        className={twMerge("justify-between", inputClassName)}
        onValueChange={field.handleChange}
        value={field.state.value ?? false}
      />
      {!!description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  );
};
