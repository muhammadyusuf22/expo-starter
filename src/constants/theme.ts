// Theme Constants
export const COLORS = {
  // Primary
  primary: "#6366F1",
  primaryDark: "#4F46E5",
  primaryLight: "#818CF8",

  // Accent
  accent: "#10B981",
  accentDark: "#059669",

  // Neutrals
  background: "#0F0F1A",
  surface: "#1A1A2E",
  surfaceLight: "#252542",

  // Text
  textPrimary: "#FFFFFF",
  textSecondary: "#A0A0B2",
  textMuted: "#6B6B80",

  // Status
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",

  // Glass
  glassBackground: "rgba(255, 255, 255, 0.08)",
  glassBorder: "rgba(255, 255, 255, 0.12)",
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export type ColorKeys = keyof typeof COLORS;
export type SpacingKeys = keyof typeof SPACING;
export type RadiusKeys = keyof typeof RADIUS;
