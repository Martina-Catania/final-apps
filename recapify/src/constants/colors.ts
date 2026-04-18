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
  background:     '#FAF7F4',
  surface:        '#FFFFFF',
  surfaceMuted:   '#F2EDE7',
  border:         '#DDD3C8',
  primary:        '#6B4423',
  primaryMuted:   '#C49A72',
  secondary:      '#3A6351',
  secondaryMuted: '#8BB8A2',
  textPrimary:    '#2C1F0F',
  textSecondary:  '#7A6555',
  textInverse:    '#FAF7F4',
  success:        '#3A8C5C',
  warning:        '#C47F1A',
  danger:         '#C03A2B',
  overlay:        'rgba(44,31,15,0.45)',
  shadow:         'rgba(107,68,35,0.14)',
};

export const darkColors: ThemeColors = {
  background:     '#1A1310',
  surface:        '#241C16',
  surfaceMuted:   '#2E231A',
  border:         '#4A3728',
  primary:        '#C49A72',
  primaryMuted:   '#6B4423',
  secondary:      '#72B89A',
  secondaryMuted: '#3A6351',
  textPrimary:    '#F2EDE7',
  textSecondary:  '#A89280',
  textInverse:    '#2C1F0F',
  success:        '#60C48A',
  warning:        '#E8A83A',
  danger:         '#E86A5A',
  overlay:        'rgba(10,6,3,0.65)',
  shadow:         'rgba(0,0,0,0.45)',
};

export const themeColors: Record<ThemeMode, ThemeColors> = {
  light: lightColors,
  dark: darkColors,
};
