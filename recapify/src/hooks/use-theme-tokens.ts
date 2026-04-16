import { useColorScheme } from "react-native";

import { ThemeMode, getThemeByMode } from "../constants";

export const useThemeTokens = () => {
  const scheme = useColorScheme();
  const mode: ThemeMode = scheme === "dark" ? "dark" : "light";
  const currentTheme = getThemeByMode(mode);

  return currentTheme;
};
