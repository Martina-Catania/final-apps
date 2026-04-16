export const SPACING = {
  xxs: 2, //spacing between icons and text in a button
  xs: 4, //small gaps between list items or form fields
  sm: 8, //moderate spacing between sections in a card
  md: 12, //large gaps between major sections of a screen
  lg: 16, //generous spacing around modals or between major screen areas
  xl: 24, //very large spacing top-level padding on a screen
  xxl: 32, //extra large spacing margins on a full-screen layout
} as const;

export const RADIUS = {
  xs: 6, // subtle rounding for buttons and inputs
  sm: 10, // moderate rounding for cards and modals
  md: 14, // larger rounding for buttons and inputs
  lg: 18, // pronounced rounding for cards and modals
  pill: 999,  // fully rounded for pills and circular avatars
} as const;

export const ICON_SIZES = {
  sm: 16, // small icons for buttons and inputs
  md: 20, // medium icons for list items and cards
  lg: 24, // large icons for headers and important actions
  xl: 30, // extra large icons for prominent actions and empty states
} as const;

