export const hyacinthBlue = {
  700: "#12123C",
  600: "#1F1F7A",
  500: "#2828BD",
  400: "#4D4DFF",
  300: "#7E7EFF",
  200: "#B2B2FF",
  100: "#E5E5FE",
  50: "#F0F0FE",
  20: "#F8F8FF",
} as const;

export const charcoal = {
  700: "#0B0B0C",
  600: "#222228",
  500: "#3A3943",
  400: "#767786",
  300: "#ACACB7",
  200: "#E2E2E6",
  100: "#F0F0F2",
  50: "#F7F7F8",
  white: "#FFFFFF",
} as const;

export const semanticColors = {
  brand: hyacinthBlue[400],
  brandHover: hyacinthBlue[500],
  brandDark: hyacinthBlue[600],
  brandSubtle: hyacinthBlue[50],
  heading: charcoal[700],
  body: charcoal[500],
  icon: charcoal[500],
  background: charcoal[50],
  border: charcoal[200],
  surface: charcoal.white,
} as const;
