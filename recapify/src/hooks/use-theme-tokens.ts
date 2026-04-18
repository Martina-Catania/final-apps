import { getThemeByMode } from "../constants";
import { useThemePreference } from "../context/theme-context";

export const useThemeTokens = () => {
  const { mode } = useThemePreference();
  const currentTheme = getThemeByMode(mode);

  return currentTheme;
};
