import { useKeyboard } from "@/hooks/use-keyboard";
import Animated, {
  Easing,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

export const AnimatedSpacer = ({ height }: { height: number }) => {
  const { isKeyboardVisible } = useKeyboard();
  const spacerStyle = useAnimatedStyle(() => ({
    height: withTiming(isKeyboardVisible ? height : 0, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    }),
  }));
  return <Animated.View style={spacerStyle} />;
};
