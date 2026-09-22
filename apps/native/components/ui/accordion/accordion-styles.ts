import { combineStyles } from "@/lib/combine-styles";
import { StyleSheet } from "react-native";
import { tv } from "tailwind-variants";

const root = tv({
  slots: {
    // overflow-hidden here is load-bearing: it's what turns the layout
    // transition into a "reveal" instead of an instant content pop.
    container: "flex-col overflow-hidden",
    separator: "h-hairline bg-separator",
  },
  variants: {
    variant: {
      default: { container: "", separator: "" },
      surface: {
        container: "bg-surface rounded-3xl",
        separator: "mx-3",
      },
    },
  },
  defaultVariants: { variant: "default" },
});

const item = tv({
  // same reasoning as root's container — clips the content while its
  // own height is mid-transition.
  base: "flex-col overflow-hidden",
});

const trigger = tv({
  base: "flex-row items-center justify-between py-4 px-3 gap-4 bg-transparent z-10",
  variants: {
    variant: { default: "", surface: "px-5" },
  },
  defaultVariants: { variant: "default" },
});

const indicator = tv({
  base: "items-center justify-center",
});

const content = tv({
  base: "px-3 pb-4 bg-transparent",
  variants: {
    variant: { default: "", surface: "px-5" },
  },
  defaultVariants: { variant: "default" },
});

export const accordionClassNames = combineStyles({
  root,
  item,
  trigger,
  indicator,
  content,
});

export const accordionStyleSheet = StyleSheet.create({
  root: { borderCurve: "continuous" },
});

export type RootSlots = keyof ReturnType<typeof root>;
