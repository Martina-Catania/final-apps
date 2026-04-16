// define theme colors
export type ThemeMode = "light" | "dark";

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  primary: string;
  primaryMuted: string;
  secondary: string;
  secondaryMuted: string;
  textPrimary: string;
  textSecondary: string;
  textInverse: string;
  success: string;
  warning: string;
  danger: string;
  overlay: string;
  shadow: string;
};

export const lightColors: ThemeColors = {
  background: "#F2F5F9",
  surface: "#FFFFFF",
  surfaceMuted: "#E8EEF5",
  border: "#C6D4E5",
  primary: "#0F5FBF",
  primaryMuted: "#D5E6FB",
  secondary: "#0B8AB8",
  secondaryMuted: "#D2F0FA",
  textPrimary: "#0E1C2F",
  textSecondary: "#4C617A",
  textInverse: "#FFFFFF",
  success: "#1C8C5E",
  warning: "#B57A00",
  danger: "#C13D3D",
  overlay: "rgba(11, 21, 36, 0.45)",
  shadow: "rgba(11, 21, 36, 0.18)",
};

export const darkColors: ThemeColors = {
  background: "#0B1422",
  surface: "#14233A",
  surfaceMuted: "#1B2C45",
  border: "#314666",
  primary: "#61A2FF",
  primaryMuted: "#1D3A66",
  secondary: "#59D6FF",
  secondaryMuted: "#1A4A5E",
  textPrimary: "#E8F1FC",
  textSecondary: "#A2B7D4",
  textInverse: "#07111F",
  success: "#58D49E",
  warning: "#F1B84C",
  danger: "#FF8A8A",
  overlay: "rgba(1, 6, 13, 0.62)",
  shadow: "rgba(0, 0, 0, 0.4)",
};

export const themeColors: Record<ThemeMode, ThemeColors> = {
  light: lightColors,
  dark: darkColors,
};
