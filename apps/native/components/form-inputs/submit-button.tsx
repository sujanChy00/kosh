import { useFormContext } from "@/contexts/form-context";
import { PressableProps } from "react-native";
import { PrimaryButton } from "../ui/button";

export const SubmitButton = ({ disabled = false, ...rest }: PressableProps) => {
  const form = useFormContext();

  return (
    <form.Subscribe
      selector={(state) => [state.isSubmitting, state.isFieldsValidating]}
    >
      {([isSubmitting, isValidating]) => (
        <PrimaryButton
          disabled={isSubmitting || isValidating || disabled}
          onPress={() => {
            form.handleSubmit();
          }}
          {...rest}
        />
      )}
    </form.Subscribe>
  );
};
