import { tv, type VariantProps } from "@kosh-app/utils";
import { createContext, useContext, useMemo } from "react";
import { Pressable, PressableProps, TextProps } from "react-native";
import { ThemedText } from "../themed-text";

const root = tv({
  base: "self-start flex-row items-center justify-center gap-1 overflow-hidden",
  variants: {
    variant: {
      primary: "",
      secondary: "bg-default",
      tertiary: "bg-transparent",
      soft: "",
    },
    size: {
      sm: "px-2 py-0.5 rounded-xl",
      md: "px-3 py-[3px] rounded-2xl",
      lg: "px-4 py-1 rounded-3xl",
    },
    color: {
      primary: "",
      default: "",
      success: "",
      warning: "",
      danger: "",
    },
  },
  compoundVariants: [
    { variant: "primary", color: "primary", className: "bg-primary" },
    { variant: "primary", color: "default", className: "bg-default" },
    { variant: "primary", color: "success", className: "bg-success" },
    { variant: "primary", color: "warning", className: "bg-warning" },
    { variant: "primary", color: "danger", className: "bg-danger" },
    { variant: "soft", color: "primary", className: "bg-primary/15" },
    { variant: "soft", color: "default", className: "bg-default" },
    { variant: "soft", color: "success", className: "bg-success/15" },
    { variant: "soft", color: "warning", className: "bg-warning/15" },
    { variant: "soft", color: "danger", className: "bg-danger/15" },
  ],
  defaultVariants: { size: "md", variant: "primary", color: "primary" },
});

const label = tv({
  base: "font-medium",
  variants: {
    variant: { primary: "", secondary: "", tertiary: "", soft: "" },
    size: { sm: "text-xs", md: "text-sm", lg: "text-base" },
    color: { primary: "", default: "", success: "", warning: "", danger: "" },
  },
  compoundVariants: [
    {
      variant: "primary",
      color: "primary",
      className: "text-primary-foreground",
    },
    {
      variant: "primary",
      color: "default",
      className: "text-default-foreground",
    },
    {
      variant: "primary",
      color: "success",
      className: "text-success-foreground",
    },
    {
      variant: "primary",
      color: "warning",
      className: "text-warning-foreground",
    },
    {
      variant: "primary",
      color: "danger",
      className: "text-danger-foreground",
    },

    { variant: "secondary", color: "primary", className: "text-primary" },
    {
      variant: "secondary",
      color: "default",
      className: "text-default-foreground",
    },
    { variant: "secondary", color: "success", className: "text-success" },
    { variant: "secondary", color: "warning", className: "text-warning" },
    { variant: "secondary", color: "danger", className: "text-danger" },

    { variant: "tertiary", color: "primary", className: "text-foreground" },
    {
      variant: "tertiary",
      color: "default",
      className: "text-default-foreground",
    },
    { variant: "tertiary", color: "success", className: "text-success" },
    { variant: "tertiary", color: "warning", className: "text-warning" },
    { variant: "tertiary", color: "danger", className: "text-danger" },

    { variant: "soft", color: "primary", className: "text-primary" },
    { variant: "soft", color: "default", className: "text-default-foreground" },
    { variant: "soft", color: "success", className: "text-success" },
    { variant: "soft", color: "warning", className: "text-warning" },
    { variant: "soft", color: "danger", className: "text-danger" },
  ],
  defaultVariants: { size: "md", variant: "primary", color: "primary" },
});

type ChipVariants = VariantProps<typeof root>;

const ChipContext = createContext<Required<ChipVariants> | null>(null);

const useChip = () => {
  const ctx = useContext(ChipContext);
  if (!ctx) {
    throw new Error("Chip.Label must be used within Chip.Root");
  }
  return ctx;
};

interface ChipRootProps extends PressableProps, ChipVariants {
  className?: string;
}

const Root = ({
  className,
  variant = "primary",
  size = "md",
  color = "primary",
  children,
  ...rest
}: ChipRootProps) => {
  const contextValue = useMemo(
    () => ({ variant, size, color }),
    [variant, size, color],
  );

  return (
    <ChipContext.Provider value={contextValue}>
      <Pressable
        className={root({ variant, size, color, className })}
        {...rest}
      >
        {typeof children === "string" ? <Label>{children}</Label> : children}
      </Pressable>
    </ChipContext.Provider>
  );
};

interface ChipLabelProps extends TextProps {
  className?: string;
}

const Label = ({ className, ...rest }: ChipLabelProps) => {
  const { variant, size, color } = useChip();

  return (
    <ThemedText
      className={label({ variant, size, color, className })}
      {...rest}
    />
  );
};
export const Chip = Object.assign(Root, {
  Label,
});
