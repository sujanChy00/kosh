import { useFieldContext } from "@/contexts/form-context";
import LOCK_ICON from "@expo/material-symbols/lock.xml";
import VISIBLITY_ON from "@expo/material-symbols/visibility.xml";
import VISIBLITY_OFF from "@expo/material-symbols/visibility_off.xml";
import { Icon, IconToggleButton } from "@expo/ui/jetpack-compose";
import { useState } from "react";
import { Field, FieldError } from "../ui/field";
import { TextInput, TextInputProps } from "../ui/text-input";
import { FormInputBaseProps } from "./types";

export const PasswordField = ({
  className,
  label,
  placeholder,
  ...rest
}: FormInputBaseProps<TextInputProps>) => {
  const [showPassword, setShowPassword] = useState(false);
  const field = useFieldContext<string | undefined>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const fieldError = field.state.meta.errors?.[0];

  return (
    <Field className={className}>
      <TextInput
        visualTransformation={showPassword ? "none" : "password"}
        label={label}
        placeholder={placeholder}
        isInvalid={isInvalid}
        onChangeText={(text) => field.handleChange(text)}
        value={field.state.value}
        {...rest}
        prefix={<Icon source={LOCK_ICON} size={18} />}
        suffix={
          <IconToggleButton
            checked={showPassword}
            onCheckedChange={setShowPassword}
          >
            <Icon
              source={showPassword ? VISIBLITY_ON : VISIBLITY_OFF}
              size={24}
            />
          </IconToggleButton>
        }
      />
      {!!fieldError?.message && <FieldError>{fieldError?.message}</FieldError>}
    </Field>
  );
};
