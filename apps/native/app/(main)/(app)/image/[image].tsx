import { ThemedText } from "@/components/themed-text";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const ImageScreen = () => {
  const router = useRouter();
  const [isZoomed, setIsZoomed] = useState(false);
  const { width, height } = useWindowDimensions();
  const { image } = useLocalSearchParams<{ image: string }>();

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(1, savedScale.value * e.scale);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .enabled(isZoomed)
    .onUpdate((e) => {
      const maxTranslateX = (width * scale.value - width) / 2;
      const maxTranslateY = (height * scale.value - height) / 2;
      const nextX = savedTranslateX.value + e.translationX;
      const nextY = savedTranslateY.value + e.translationY;
      translateX.value = Math.min(
        Math.max(nextX, -maxTranslateX),
        maxTranslateX,
      );
      translateY.value = Math.min(
        Math.max(nextY, -maxTranslateY),
        maxTranslateY,
      );
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      if (scale.value !== 1) {
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withTiming(2);
        savedScale.value = 2;
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const combinedGesture = Gesture.Exclusive(
    Gesture.Simultaneous(pinchGesture, panGesture),
    doubleTap,
  );

  useAnimatedReaction(
    () => scale.value > 1,
    (zoomed, previouslyZoomed) => {
      if (zoomed !== previouslyZoomed) {
        scheduleOnRN(setIsZoomed, zoomed);
      }
    },
  );

  if (!image)
    return (
      <View className="flex-1 items-center justify-center">
        <ThemedText className="text-center italic text-danger">
          Something went wrong while loading image
        </ThemedText>
      </View>
    );

  return (
    <View className="flex-1 justify-center items-center">
      <GestureDetector gesture={combinedGesture}>
        <Link.AppleZoomTarget>
          <Animated.Image
            style={[
              {
                width: "100%",
                height: "100%",
              },
              animatedStyle,
            ]}
            source={{ uri: image }}
            resizeMode="contain"
          />
        </Link.AppleZoomTarget>
      </GestureDetector>
    </View>
  );
};

export default ImageScreen;
