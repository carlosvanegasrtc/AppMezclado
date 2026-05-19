export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const Radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 14,
  xl: 18,
  xxl: 24,
  sheet: 32,
  pill: 999,
} as const;

export const HitSlop = {
  small: { top: 6, bottom: 6, left: 6, right: 6 },
  medium: { top: 10, bottom: 10, left: 10, right: 10 },
  large: { top: 14, bottom: 14, left: 14, right: 14 },
} as const;
