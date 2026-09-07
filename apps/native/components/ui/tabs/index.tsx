import { AnimatedView } from "@/components/animated-view";
import { ThemedText } from "@/components/themed-text";
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  LayoutChangeEvent,
  Pressable,
  PressableProps,
  ScrollView,
  ScrollViewProps,
  TextProps,
  useWindowDimensions,
  View,
  ViewProps,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  ItemMeasurements,
  MeasurementsProvider,
  TabsRootProvider,
  TriggerProvider,
  useTabs,
  useTabsMeasurements,
  useTabsTrigger,
} from "./tab-context";
import {
  content,
  indicator,
  label,
  list,
  root,
  scrollView,
  scrollViewContentContainer,
  separator,
  tabsStyleSheet,
  trigger,
} from "./tab-styles";

const INDICATOR_SPRING_CONFIG = { stiffness: 1200, damping: 120 };

// --------------------------------------------------
interface TabsProps extends ViewProps {
  value: string;
  onValueChange: (value: string) => void;
  variant?: "primary" | "secondary";
}

const Root = ({
  children,
  value,
  onValueChange,
  className,
  variant = "primary",
  ...rest
}: TabsProps) => {
  const [measurements, setMeasurementsState] = useState<
    Record<string, ItemMeasurements>
  >({});
  const [isScrollView, setIsScrollView] = useState(false);

  const setMeasurements = useCallback(
    (key: string, m: ItemMeasurements) =>
      setMeasurementsState((prev) => ({ ...prev, [key]: m })),
    [],
  );

  const measurementsValue = useMemo(
    () => ({
      measurements,
      setMeasurements,
      variant,
      isScrollView,
      setIsScrollView,
    }),
    [measurements, setMeasurements, variant, isScrollView],
  );

  const rootValue = useMemo(
    () => ({ value, onValueChange }),
    [value, onValueChange],
  );

  return (
    <TabsRootProvider value={rootValue}>
      <MeasurementsProvider value={measurementsValue}>
        <View className={root({ className })} {...rest}>
          {children}
        </View>
      </MeasurementsProvider>
    </TabsRootProvider>
  );
};

// --------------------------------------------------
const List = ({ children, className, style, ...rest }: ViewProps) => {
  const { variant, setIsScrollView } = useTabsMeasurements();

  const handleLayout = useCallback(() => {
    const childrenArray = Children.toArray(children);
    const hasScrollView =
      childrenArray.length === 1 &&
      isValidElement(childrenArray[0]) &&
      childrenArray[0].type === TabsScrollView;
    setIsScrollView(hasScrollView);
  }, [children, setIsScrollView]);

  return (
    <View
      className={list({ variant, className })}
      style={[tabsStyleSheet.listRoot, style]}
      onLayout={handleLayout}
      {...rest}
    >
      {children}
    </View>
  );
};

// --------------------------------------------------
interface TabsScrollViewProps extends ScrollViewProps {
  contentContainerClassName?: string;
  scrollAlign?: "start" | "center" | "end" | "none";
}

const TabsScrollView = ({
  children,
  className,
  contentContainerClassName,
  showsHorizontalScrollIndicator = false,
  scrollAlign = "center",
  ...rest
}: TabsScrollViewProps) => {
  const { value } = useTabs();
  const { measurements, variant } = useTabsMeasurements();
  const { width: screenWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (scrollAlign === "none" || !measurements[value]) return;
    const m = measurements[value];
    let scrollToX = 0;

    if (scrollAlign === "start") scrollToX = m.x;
    else if (scrollAlign === "center")
      scrollToX = m.x + m.width / 2 - screenWidth / 2;
    else if (scrollAlign === "end") scrollToX = m.x + m.width - screenWidth;

    scrollRef.current?.scrollTo({ x: Math.max(0, scrollToX), animated: true });
  }, [value, measurements, scrollAlign, screenWidth]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      className={scrollView({ variant, className })}
      contentContainerClassName={scrollViewContentContainer({
        variant,
        className: contentContainerClassName,
      })}
      {...rest}
    >
      {children}
    </ScrollView>
  );
};
TabsScrollView.displayName = "Tabs.ScrollView";

// --------------------------------------------------
interface TabsTriggerRenderProps {
  isSelected: boolean;
  value: string;
  isDisabled: boolean;
}

interface TabsTriggerProps extends Omit<PressableProps, "children"> {
  value: string;
  isDisabled?: boolean;
  className?: string;
  children?:
    React.ReactNode | ((props: TabsTriggerRenderProps) => React.ReactNode);
}

const Trigger = ({
  children,
  value,
  isDisabled = false,
  className,
  style,
  onPress,
  ...rest
}: TabsTriggerProps) => {
  const { value: rootValue, onValueChange } = useTabs();
  const { setMeasurements } = useTabsMeasurements();
  const isSelected = rootValue === value;

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height, x } = event.nativeEvent.layout;
      setMeasurements(value, { width, height, x });
    },
    [value, setMeasurements],
  );

  const handlePress = useCallback(
    (event: Parameters<NonNullable<PressableProps["onPress"]>>[0]) => {
      if (!isDisabled) onValueChange(value);
      onPress?.(event);
    },
    [isDisabled, onValueChange, value, onPress],
  );

  const triggerContextValue = useMemo(
    () => ({ value, isSelected, isDisabled }),
    [value, isSelected, isDisabled],
  );

  const renderProps: TabsTriggerRenderProps = { isSelected, value, isDisabled };
  const content_ =
    typeof children === "function" ? children(renderProps) : children;

  return (
    <TriggerProvider value={triggerContextValue}>
      <Pressable
        disabled={isDisabled}
        onPress={handlePress}
        onLayout={handleLayout}
        className={trigger({ isDisabled, className })}
        style={(state) => [
          tabsStyleSheet.triggerRoot,
          typeof style === "function" ? style(state) : style,
        ]}
        accessibilityRole="tab"
        accessibilityState={{ selected: isSelected, disabled: isDisabled }}
        {...rest}
      >
        {content_}
      </Pressable>
    </TriggerProvider>
  );
};

// --------------------------------------------------
const Label = ({ className, ...rest }: TextProps) => {
  const { isSelected } = useTabsTrigger();
  return <ThemedText className={label({ isSelected, className })} {...rest} />;
};

// --------------------------------------------------
interface TabsIndicatorProps extends ViewProps {
  animation?: false;
}

const Indicator = ({
  className,
  style,
  animation,
  ...rest
}: TabsIndicatorProps) => {
  const { value } = useTabs();
  const { measurements, variant, isScrollView } = useTabsMeasurements();
  const activeMeasurements = measurements[value];
  const isAnimationDisabled = animation === false;

  const animatedStyle = useAnimatedStyle(() => {
    if (!activeMeasurements) {
      return {
        width: 0,
        height: 0,
        transform: [{ translateX: 0 }],
        opacity: 0,
      };
    }

    if (isAnimationDisabled) {
      return {
        width: activeMeasurements.width,
        height: activeMeasurements.height,
        transform: [{ translateX: activeMeasurements.x }],
        opacity: 1,
      };
    }

    return {
      width: withSpring(activeMeasurements.width, INDICATOR_SPRING_CONFIG),
      height: withSpring(activeMeasurements.height, INDICATOR_SPRING_CONFIG),
      transform: [
        {
          translateX: withSpring(activeMeasurements.x, INDICATOR_SPRING_CONFIG),
        },
      ],
      opacity: withTiming(1, { duration: 200 }),
    };
  }, [activeMeasurements, isAnimationDisabled]);

  return (
    <Animated.View
      className={indicator({ variant, isScrollView, className })}
      style={[animatedStyle, style]}
      {...rest}
    />
  );
};

// --------------------------------------------------
interface TabsSeparatorProps extends ViewProps {
  betweenValues: string[];
  isAlwaysVisible?: boolean;
  animation?: false;
}

const Separator = ({
  betweenValues,
  isAlwaysVisible = false,
  animation,
  className,
  style,
  ...rest
}: TabsSeparatorProps) => {
  const { value } = useTabs();
  const isAnimationDisabled = animation === false;

  const animatedStyle = useAnimatedStyle(() => {
    if (isAlwaysVisible) return { opacity: 1 };
    const isVisible = !betweenValues.includes(value);
    const targetOpacity = isVisible ? 1 : 0;
    return {
      opacity: isAnimationDisabled
        ? targetOpacity
        : withTiming(targetOpacity, { duration: 200 }),
    };
  }, [value, betweenValues, isAlwaysVisible, isAnimationDisabled]);

  return (
    <Animated.View
      className={separator({ className })}
      style={[animatedStyle, style]}
      {...rest}
    />
  );
};

// --------------------------------------------------
interface TabsContentProps extends ViewProps {
  value: string;
}

const Content = ({ children, value, className, ...rest }: TabsContentProps) => {
  const { value: activeValue } = useTabs();
  if (activeValue !== value) return null;

  return (
    <AnimatedView className={content({ className })} {...rest}>
      {children}
    </AnimatedView>
  );
};

// --------------------------------------------------
export const Tabs = Object.assign(Root, {
  List,
  ScrollView: TabsScrollView,
  Trigger,
  Label,
  Indicator,
  Separator,
  Content,
});
