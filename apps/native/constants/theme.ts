import { DarkTheme, DefaultTheme, Theme } from "expo-router/react-navigation";
import { isIOS } from "./platform";

const ANDROID_THEME: { light: Theme; dark: Theme } = {
  light: {
    dark: false,
    colors: {
      background: "rgb(249, 249, 255)",
      border: "rgb(215, 217, 228)",
      card: "rgb(255, 255, 255)",
      notification: "rgb(186, 26, 26)",
      primary: "rgb(0, 112, 233)",
      text: "rgb(0, 0, 0)",
    },
    fonts: DefaultTheme.fonts,
  },
  dark: {
    dark: true,
    colors: {
      background: "rgb(0, 0, 0)",
      border: "rgb(39, 42, 50)",
      card: "rgb(16, 19, 27)",
      notification: "rgb(147, 0, 10)",
      primary: "rgb(3, 133, 255)",
      text: "rgb(255, 255, 255)",
    },
    fonts: DarkTheme.fonts,
  },
};
const IOS_THEME: { light: Theme; dark: Theme } = {
  light: {
    dark: false,
    colors: {
      background: "rgb(242, 242, 247)",
      border: "rgb(230, 230, 235)",
      card: "rgb(255, 255, 255)",
      notification: "rgb(255, 56, 43)",
      primary: "rgb(0, 123, 254)",
      text: "rgb(0, 0, 0)",
    },
    fonts: DefaultTheme.fonts,
  },
  dark: {
    dark: true,
    colors: {
      background: "rgb(0, 0, 0)",
      border: "rgb(40, 40, 42)",
      card: "rgb(21, 21, 24)",
      notification: "rgb(254, 67, 54)",
      primary: "rgb(3, 133, 255)",
      text: "rgb(255, 255, 255)",
    },
    fonts: DarkTheme.fonts,
  },
};

export const NAV_THEME: { light: Theme; dark: Theme } = isIOS
  ? IOS_THEME
  : ANDROID_THEME;
