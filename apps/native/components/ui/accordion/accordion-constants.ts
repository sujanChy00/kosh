import {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";

export const DISPLAY_NAME = {
  ROOT: "Accordion.Root",
  ITEM: "Accordion.Item",
  TRIGGER: "Accordion.Trigger",
  INDICATOR: "Accordion.Indicator",
  CONTENT: "Accordion.Content",
} as const;

// Springify, not timing — matches how native disclosure groups settle
// rather than ease-out-and-stop, and it's what makes multi-item reflow
// (siblings shifting when one expands) feel connected instead of janky.
export const ACCORDION_LAYOUT_TRANSITION = LinearTransition.springify()
  .damping(140)
  .stiffness(1600)
  .mass(4);

export const DEFAULT_ICON_SIZE = 16;

// [collapsed, expanded] rotation in degrees
export const INDICATOR_ROTATION: [number, number] = [0, -180];

export const INDICATOR_SPRING_CONFIG = {
  damping: 140,
  stiffness: 1000,
  mass: 4,
};

export const DEFAULT_CONTENT_ENTERING = FadeIn.duration(200).easing(
  Easing.out(Easing.ease),
);
export const DEFAULT_CONTENT_EXITING = FadeOut.duration(200).easing(
  Easing.in(Easing.ease),
);
