import {
  Children,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pressable } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { StyledSymbolView } from "@/components/styled-symbol-view";
import {
  ACCORDION_LAYOUT_TRANSITION,
  DEFAULT_CONTENT_ENTERING,
  DEFAULT_CONTENT_EXITING,
  DEFAULT_ICON_SIZE,
  DISPLAY_NAME,
  INDICATOR_ROTATION,
  INDICATOR_SPRING_CONFIG,
} from "./accordion-constants";
import { accordionClassNames, accordionStyleSheet } from "./accordion-styles";
import type {
  AccordionContentProps,
  AccordionContextValue,
  AccordionIndicatorProps,
  AccordionItemContextValue,
  AccordionItemProps,
  AccordionItemRenderProps,
  AccordionRootProps,
  AccordionTriggerProps,
} from "./accordion-types";

// ------------------------------------------------------------------------------
// Context

const AccordionContext = createContext<AccordionContextValue | null>(null);
const AccordionItemContext = createContext<AccordionItemContextValue | null>(
  null,
);

export function useAccordion() {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error("useAccordion must be used within Accordion");
  return ctx;
}

export function useAccordionItem() {
  const ctx = useContext(AccordionItemContext);
  if (!ctx)
    throw new Error("useAccordionItem must be used within Accordion.Item");
  return ctx;
}

// ------------------------------------------------------------------------------
// Root

export function Root(props: AccordionRootProps) {
  const {
    children,
    selectionMode = "single",
    variant = "default",
    hideSeparator = false,
    defaultValue,
    value: controlledValue,
    onValueChange,
    isDisabled,
    isCollapsible = true,
    animation,
    className,
    classNames,
    styles,
    style,
    ref,
    ...restProps
  } = props;
  const isControlled = useRef("value" in props).current;

  const [internalValue, setInternalValue] = useState<
    string | string[] | undefined
  >(defaultValue ?? (selectionMode === "multiple" ? [] : undefined));

  const value = isControlled ? controlledValue : internalValue;

  const handleValueChange = (next: string | string[] | undefined) => {
    if (!isControlled) setInternalValue(next);
    onValueChange?.(next);
  };

  const layoutTransition =
    animation === false
      ? undefined
      : (animation?.layout ?? ACCORDION_LAYOUT_TRANSITION);

  const contextValue = useMemo<AccordionContextValue>(
    () => ({
      selectionMode,
      isCollapsible,
      isDisabled,
      variant,
      value,
      onValueChange: handleValueChange,
    }),
    [selectionMode, isCollapsible, isDisabled, variant, value],
  );

  const { container, separator } = accordionClassNames.root({ variant });
  const childCount = Children.count(children);

  return (
    <AccordionContext.Provider value={contextValue}>
      <Animated.View
        ref={ref}
        layout={layoutTransition}
        className={container({ className: [className, classNames?.container] })}
        style={[accordionStyleSheet.root, style, styles?.container]}
        {...restProps}
      >
        {Children.map(children, (child, index) => (
          <>
            {child}
            {!hideSeparator && index < childCount - 1 && (
              <Animated.View
                layout={layoutTransition}
                className={separator({ className: classNames?.separator })}
                style={styles?.separator}
              />
            )}
          </>
        ))}
      </Animated.View>
    </AccordionContext.Provider>
  );
}

// ------------------------------------------------------------------------------
// Item

export function Item({
  children,
  value,
  layout: layoutProp,
  isDisabled: isDisabledProp,
  className,
  ref,
  ...restProps
}: AccordionItemProps) {
  const {
    value: rootValue,
    selectionMode,
    isCollapsible,
    isDisabled: rootDisabled,
    onValueChange,
  } = useAccordion();

  const isExpanded = Array.isArray(rootValue)
    ? rootValue.includes(value)
    : rootValue === value;
  const isDisabled = isDisabledProp ?? rootDisabled;

  const toggle = () => {
    if (isDisabled) return;

    if (selectionMode === "single") {
      const willClose = isExpanded && isCollapsible;
      onValueChange(willClose ? undefined : value);
    } else {
      const current = Array.isArray(rootValue) ? rootValue : [];
      onValueChange(
        isExpanded ? current.filter((v) => v !== value) : [...current, value],
      );
    }
  };

  const itemContextValue = useMemo<AccordionItemContextValue>(
    () => ({ value, isExpanded, isDisabled, toggle }),
    [value, isExpanded, isDisabled],
  );

  const renderProps: AccordionItemRenderProps = useMemo(
    () => ({ isExpanded, value }),
    [isExpanded, value],
  );

  const content =
    typeof children === "function" ? children(renderProps) : children;
  const itemClassName = accordionClassNames.item({ className });

  return (
    <AccordionItemContext.Provider value={itemContextValue}>
      <Animated.View
        ref={ref}
        layout={layoutProp ?? ACCORDION_LAYOUT_TRANSITION}
        className={itemClassName}
        {...restProps}
      >
        {content}
      </Animated.View>
    </AccordionItemContext.Provider>
  );
}

// ------------------------------------------------------------------------------
// Trigger

export function Trigger({
  children,
  className,
  isDisabled: isDisabledProp,
  ...restProps
}: AccordionTriggerProps) {
  const { variant } = useAccordion();
  const { isExpanded, isDisabled: itemDisabled, toggle } = useAccordionItem();
  const isDisabled = isDisabledProp ?? itemDisabled;

  const triggerClassName = accordionClassNames.trigger({ variant, className });

  return (
    <Pressable
      onPress={isDisabled ? undefined : toggle}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ expanded: isExpanded, disabled: isDisabled }}
      className={triggerClassName}
      {...restProps}
    >
      {children}
    </Pressable>
  );
}

// ------------------------------------------------------------------------------
// Indicator

export function Indicator({
  children,
  className,
  iconProps,
  animation,
  isAnimatedStyleActive = true,
  style,
  ref,
  ...restProps
}: AccordionIndicatorProps) {
  const { isExpanded } = useAccordionItem();
  const indicatorClassName = accordionClassNames.indicator({ className });

  const [collapsedDeg, expandedDeg] =
    animation === false ? [0, 0] : (animation?.rotation ?? INDICATOR_ROTATION);
  const springConfig =
    animation === false
      ? undefined
      : (animation?.springConfig ?? INDICATOR_SPRING_CONFIG);

  const progress = useSharedValue(isExpanded ? 1 : 0);

  useEffect(() => {
    progress.value =
      animation === false
        ? isExpanded
          ? 1
          : 0
        : withSpring(isExpanded ? 1 : 0, springConfig);
  }, [isExpanded, animation, springConfig]);

  const rContainerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(progress.value, [0, 1], [collapsedDeg, expandedDeg])}deg`,
      },
    ],
  }));

  const indicatorStyle = isAnimatedStyleActive
    ? [rContainerStyle, style]
    : style;

  return (
    <Animated.View
      ref={ref}
      className={indicatorClassName}
      style={indicatorStyle}
      {...restProps}
    >
      {children ?? (
        <StyledSymbolView
          name={{ android: "keyboard_arrow_down", ios: "chevron.down" }}
          size={iconProps?.size ?? DEFAULT_ICON_SIZE}
          tintColorClassName="accent-muted"
        />
      )}
    </Animated.View>
  );
}

// ------------------------------------------------------------------------------
// Content

export function Content({
  children,
  className,
  animation,
  style,
  ref,
  ...restProps
}: AccordionContentProps) {
  const { variant } = useAccordion();
  const { isExpanded } = useAccordionItem();
  const contentClassName = accordionClassNames.content({ variant, className });

  const entering =
    animation === false
      ? undefined
      : (animation?.entering ?? DEFAULT_CONTENT_ENTERING);
  const exiting =
    animation === false
      ? undefined
      : (animation?.exiting ?? DEFAULT_CONTENT_EXITING);

  if (!isExpanded) return null;

  return (
    <Animated.View
      ref={ref}
      entering={entering}
      exiting={exiting}
      className={contentClassName}
      style={style}
      {...restProps}
    >
      {children}
    </Animated.View>
  );
}

// ------------------------------------------------------------------------------

Root.displayName = DISPLAY_NAME.ROOT;
Item.displayName = DISPLAY_NAME.ITEM;
Trigger.displayName = DISPLAY_NAME.TRIGGER;
Indicator.displayName = DISPLAY_NAME.INDICATOR;
Content.displayName = DISPLAY_NAME.CONTENT;

export const Accordion = Object.assign(Root, {
  Item,
  Trigger,
  Indicator,
  Content,
});

export const AccordionLayoutTransition = ACCORDION_LAYOUT_TRANSITION;
