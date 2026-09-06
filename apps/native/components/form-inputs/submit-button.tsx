import { useFormContext } from "@/contexts/form-context";
import { TouchableOpacityProps } from "react-native";
import { PrimaryButton } from "../ui/button";

export const SubmitButton = ({
  disabled = false,
  onPress,
  ...rest
}: TouchableOpacityProps) => {
  const form = useFormContext();

  return (
    <form.Subscribe
      selector={(state) => [state.isSubmitting, state.isFieldsValidating]}
    >
      {([isSubmitting, isValidating]) => (
        <PrimaryButton
          disabled={isSubmitting || isValidating || disabled}
          onPress={(event) => {
            form.handleSubmit();
          }}
          {...rest}
        />
      )}
    </form.Subscribe>
  );
};
