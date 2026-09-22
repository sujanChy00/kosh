import { AnimatedViewProps } from "@/components/animated-view";
import type { ReactNode, Ref } from "react";
import type { PressableProps, View, ViewProps, ViewStyle } from "react-native";
import type {
  EntryExitAnimationFunction,
  WithSpringConfig,
} from "react-native-reanimated";

export type AccordionSelectionMode = "single" | "multiple";
export type AccordionVariant = "default" | "surface";

export interface AccordionContextValue {
  selectionMode: AccordionSelectionMode;
  isCollapsible: boolean;
  isDisabled?: boolean;
  variant: AccordionVariant;
  value: string | string[] | undefined;
  onValueChange: (value: string | string[] | undefined) => void;
}

export interface AccordionItemContextValue {
  value: string;
  isExpanded: boolean;
  isDisabled?: boolean;
  toggle: () => void;
}

export interface AccordionItemRenderProps {
  isExpanded: boolean;
  value: string;
}

// animation === false disables it entirely; an object overrides pieces of the default.
export type AccordionRootAnimation =
  false | { layout?: AnimatedViewProps["layout"] };
export type AccordionIndicatorAnimation =
  false | { rotation?: [number, number]; springConfig?: WithSpringConfig };
export type AccordionContentAnimation =
  | false
  | {
      entering?: EntryExitAnimationFunction;
      exiting?: EntryExitAnimationFunction;
    };

export interface AccordionRootProps extends Omit<ViewProps, "children"> {
  ref?: Ref<View>;
  children: ReactNode;
  selectionMode?: AccordionSelectionMode;
  variant?: AccordionVariant;
  hideSeparator?: boolean;
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[] | undefined) => void;
  isDisabled?: boolean;
  isCollapsible?: boolean;
  animation?: AccordionRootAnimation;
  className?: string;
  classNames?: { container?: string; separator?: string };
  styles?: { container?: ViewStyle; separator?: ViewStyle };
}

export interface AccordionItemProps extends Omit<
  AnimatedViewProps,
  "children"
> {
  ref?: Ref<View>;
  children: ReactNode | ((props: AccordionItemRenderProps) => ReactNode);
  value: string;
  isDisabled?: boolean;
  className?: string;
}

export interface AccordionTriggerProps extends Omit<
  PressableProps,
  "children"
> {
  ref?: Ref<View>;
  children: ReactNode;
  className?: string;
  isDisabled?: boolean;
}

export interface AccordionIndicatorProps extends Omit<ViewProps, "children"> {
  ref?: Ref<View>;
  children?: ReactNode;
  className?: string;
  iconProps?: { size?: number; color?: string };
  animation?: AccordionIndicatorAnimation;
  isAnimatedStyleActive?: boolean;
}

export interface AccordionContentProps extends ViewProps {
  ref?: Ref<View>;
  children: ReactNode;
  className?: string;
  animation?: AccordionContentAnimation;
}
