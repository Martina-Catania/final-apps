export const PRIMARY_TEXT_SIZES = {
  xs: 12, // small text for captions and metadata
  sm: 14, // standard text for body copy and form labels
  md: 16, // default text size for most UI elements and content
  lg: 20, // larger text for headers and important information
  xl: 24, // extra large text for major headings and emphasis
  xxl: 30, // very large text for hero sections and key messages
} as const;

export const SECONDARY_TEXT_SIZES = {
  xs: 10, // tiny text for hints and secondary metadata
  sm: 12, // small text for captions and less important information
  md: 14, // standard text for body copy and form labels
  lg: 16, // larger text for headers and important information
  xl: 18, // extra large text for major headings and emphasis
} as const;

export const FONT_WEIGHTS = {
  regular: "400", // normal weight for body text and most UI elements
  medium: "500", // slightly bolder for subheadings and emphasized text
  semibold: "600", // bold for headers and important information
  bold: "700", // very bold for major headings and emphasis
} as const;


export type TextSizeKey = keyof typeof PRIMARY_TEXT_SIZES;
