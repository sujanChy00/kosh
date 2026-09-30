import { useFocusEffect } from "expo-router";
import React from "react";
import { Platform } from "react-native";

export function useRefetchOnFocus<T>(refetch: () => Promise<T>) {
  const firstTimeRef = React.useRef(true);

  useFocusEffect(
    React.useCallback(() => {
      if (Platform.OS === "web") return;

      if (firstTimeRef.current) {
        firstTimeRef.current = false;
        return;
      }

      refetch();
    }, [refetch]),
  );
}
