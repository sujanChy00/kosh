import { tv } from "@kosh-app/utils";
import { StyleSheet } from "react-native";

export const root = tv({
  base: "flex-col gap-2",
});

export const list = tv({
  base: "self-start flex-row items-center gap-1",
  variants: {
    variant: {
      primary: "p-[3px] rounded-3xl bg-default",
      secondary: "p-0 border-b border-border",
    },
  },
  defaultVariants: { variant: "primary" },
});

export const scrollView = tv({
  base: "",
  variants: {
    variant: {
      primary: "-my-[3px] rounded-3xl",
      secondary: "",
    },
  },
  defaultVariants: { variant: "primary" },
});

export const scrollViewContentContainer = tv({
  base: "",
  variants: {
    variant: {
      primary: "py-[3px] px-px",
      secondary: "",
    },
  },
  defaultVariants: { variant: "primary" },
});

export const trigger = tv({
  base: "flex-row items-center justify-center px-3 py-1.5 gap-1.5",
  variants: {
    isDisabled: {
      true: "opacity-50 pointer-events-none",
      false: "",
    },
  },
  defaultVariants: { isDisabled: false },
});

export const label = tv({
  base: "text-base font-notosans-medium",
  variants: {
    isSelected: {
      true: "text-foreground",
      false: "text-muted",
    },
  },
});

export const indicator = tv({
  base: "absolute left-0",
  variants: {
    variant: {
      primary: "rounded-3xl shadow-sm shadow-black/10 bg-surface",
      secondary: "bottom-0 border-b-2 border-primary",
    },
    isScrollView: { true: "", false: "" },
  },
  compoundVariants: [
    { variant: "primary", isScrollView: true, className: "top-[3px]" },
  ],
  defaultVariants: { variant: "primary", isScrollView: false },
});

export const separator = tv({
  base: "w-px h-3/5 bg-border self-center",
});

export const content = tv({
  base: "pt-2",
});

export const tabsStyleSheet = StyleSheet.create({
  listRoot: { borderCurve: "continuous" },
  triggerRoot: { borderCurve: "continuous" },
});
