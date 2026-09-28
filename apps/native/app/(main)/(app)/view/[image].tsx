import { StyledSymbolView } from "@/components/styled-symbol-view";
import { ThemedText } from "@/components/themed-text";
import { useShareImage } from "@/hooks/use-share-image";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {
  GestureDetector,
  useExclusiveGestures,
  usePanGesture,
  usePinchGesture,
  useSimultaneousGestures,
  useTapGesture,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const ImageScreen = () => {
  const [isZoomed, setIsZoomed] = useState(false);
  const { width, height } = useWindowDimensions();
  const { image } = useLocalSearchParams<{ image: string }>();
  const { downloadImage, isDownloading } = useShareImage(image);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinchGesture = usePinchGesture({
    onUpdate: (e) => {
      scale.value = Math.max(1, savedScale.value * e.scale);
    },
    onDeactivate: () => {
      savedScale.value = scale.value;
    },
  });

  const panGesture = usePanGesture({
    enabled: isZoomed,
    onUpdate: (e) => {
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
    },
    onDeactivate: () => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    },
  });

  const doubleTap = useTapGesture({
    numberOfTaps: 2,
    onActivate: () => {
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
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const combinedGesture = useExclusiveGestures(
    useSimultaneousGestures(pinchGesture, panGesture),
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
    <View className="flex-1 justify-center items-center bg-black/80">
      <GestureDetector gesture={combinedGesture}>
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
      </GestureDetector>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={downloadImage}
        disabled={isDownloading}
        accessibilityRole="button"
        accessibilityLabel="Save image"
        className="absolute right-4 top-14 size-10 items-center justify-center rounded-full bg-black/50 dark:bg-muted/50"
      >
        {isDownloading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <StyledSymbolView
            size={20}
            name={{
              ios: "arrow.down.circle.fill",
              android: "download",
            }}
            tintColorClassName="accent-primary-foreground"
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

export default ImageScreen;
