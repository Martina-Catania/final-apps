import { ThemeMode, themeColors } from "./colors";
import {
  FONT_WEIGHTS,
  PRIMARY_TEXT_SIZES,
  SECONDARY_TEXT_SIZES,
} from "./typography";
import { ICON_SIZES, RADIUS, SPACING } from "./spacing";

// define the overall theme structure
export const theme = {
  light: {
    mode: "light" as const,
    colors: themeColors.light,
    typography: {
      primary: PRIMARY_TEXT_SIZES,
      secondary: SECONDARY_TEXT_SIZES,
      weights: FONT_WEIGHTS,
    },
    spacing: SPACING,
    radius: RADIUS,
    iconSizes: ICON_SIZES,
  },
  dark: {
    mode: "dark" as const,
    colors: themeColors.dark,
    typography: {
      primary: PRIMARY_TEXT_SIZES,
      secondary: SECONDARY_TEXT_SIZES,
      weights: FONT_WEIGHTS,
    },
    spacing: SPACING,
    radius: RADIUS,
    iconSizes: ICON_SIZES,
  },
};

export type ThemeTokens = (typeof theme)[ThemeMode];
export const getThemeByMode = (mode: ThemeMode): ThemeTokens => theme[mode];