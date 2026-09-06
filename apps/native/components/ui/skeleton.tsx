import { cn } from "@kosh-app/utils";
import { useEffect } from "react";
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { AnimatedView, AnimatedViewProps } from "../animated-view";

export const Skeleton = ({ className, style, ...rest }: AnimatedViewProps) => {
  const opacity = useSharedValue(0.5);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });
  Skeleton;
  useEffect(() => {
    // We only define the animation going from 0.5 -> 1.
    // The `withRepeat` function will handle reversing it automatically.
    opacity.value = withRepeat(
      // Animate to an opacity of 1
      withTiming(1, {
        duration: 1000,
        easing: Easing.inOut(Easing.quad),
      }),
      -1, // Loop infinitely
      true, // Set to true to automatically reverse the animation (yoyo effect)
    );
  }, []); // Use an empty dependency array as the shared value object is stable

  return (
    <AnimatedView
      accessibilityElementsHidden
      className={cn("bg-surface-secondary w-full h-25", className)}
      accessibilityLabel="Loading content"
      style={[animatedStyle, style]}
      {...rest}
    />
  );
};
