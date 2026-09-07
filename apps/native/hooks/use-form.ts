import { DateField } from "@/components/form-inputs/date-field";
import { PasswordField } from "@/components/form-inputs/password-field";

import { SelectField } from "@/components/form-inputs/select-field";
import { SubmitButton } from "@/components/form-inputs/submit-button";
import { SwitchField } from "@/components/form-inputs/switch-field";
import { TextField } from "@/components/form-inputs/text-field";
import { fieldContext, formContext } from "@/contexts/form-context";

import { createFormHook } from "@tanstack/react-form";

const { useAppForm: useForm, withForm } = createFormHook({
  fieldComponents: {
    TextField,
    PasswordField,
    DateField,
    SwitchField,
    SelectField,
  },
  formComponents: {
    SubmitButton,
  },
  fieldContext,
  formContext,
});

export { useForm, withForm };
