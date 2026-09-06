export type FormInputBaseProps<T> = T & {
  label?: string;
  isDisabled?: boolean;
  description?: string;
  inputClassName?: string;
};
