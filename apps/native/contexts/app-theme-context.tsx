import { NAV_THEME } from "@/constants/theme";
import { storage } from "@/utils/storage";
import { THEME_KEY } from "@kosh-app/utils";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Uniwind } from "uniwind";

type ThemeName = "light" | "dark";

type AppThemeContextType = {
  currentTheme: ThemeName;
  isLight: boolean;
  isDark: boolean;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
};

const AppThemeContext = createContext<AppThemeContextType | undefined>(
  undefined,
);

export const AppThemeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [appTheme, setAppTheme] = useState<ThemeName>(() => {
    const saved = (storage.getString(THEME_KEY) as ThemeName) || "light";
    Uniwind.setTheme(saved);
    return saved;
  });

  const isLight = useMemo(() => {
    return appTheme === "light";
  }, [appTheme]);

  const isDark = useMemo(() => {
    return appTheme === "dark";
  }, [appTheme]);

  const setTheme = useCallback((newTheme: ThemeName) => {
    Uniwind.setTheme(newTheme);
    setAppTheme(newTheme);
    storage.set(THEME_KEY, newTheme);
  }, []);

  const toggleTheme = useCallback(async () => {
    const newTheme = appTheme === "light" ? "dark" : "light";
    Uniwind.setTheme(newTheme);
    setAppTheme(newTheme);
    storage.set(THEME_KEY, newTheme);
  }, [appTheme]);

  const value = useMemo(
    () => ({
      currentTheme: appTheme as ThemeName,
      isLight,
      isDark,
      setTheme,
      toggleTheme,
    }),
    [appTheme, isLight, isDark, setTheme, toggleTheme],
  );

  return (
    <AppThemeContext.Provider value={value}>
      {children}
    </AppThemeContext.Provider>
  );
};

export function useAppTheme() {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }
  const { colors } = NAV_THEME[context.currentTheme];
  return { ...context, colors };
}
