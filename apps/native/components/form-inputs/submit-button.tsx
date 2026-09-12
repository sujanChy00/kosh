import { useFormContext } from "@/contexts/form-context";
import { cn } from "@kosh-app/utils";
import {
  ActivityIndicator,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";

export const SubmitButton = ({
  disabled = false,
  onPress,
  children,
  className,
  ...rest
}: TouchableOpacityProps) => {
  const form = useFormContext();

  return (
    <form.Subscribe
      selector={(state) => [state.isSubmitting, state.isFieldsValidating]}
    >
      {([isSubmitting, isValidating]) => (
        <TouchableOpacity
          disabled={isSubmitting || isValidating || disabled}
          onPress={(event) => {
            form.handleSubmit();
          }}
          {...rest}
        >
          <View
            className={cn(
              "bg-primary flex-row items-center justify-center h-12 px-4 gap-2 rounded-3xl",
              disabled && "opacity-50",
              className,
            )}
          >
            {isSubmitting && (
              <ActivityIndicator
                size={"small"}
                colorClassName="accent-primary-foreground"
              />
            )}
            {children}
          </View>
        </TouchableOpacity>
      )}
    </form.Subscribe>
  );
};
