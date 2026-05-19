import { Platform } from 'react-native';

export const FontFamily = {
  sans: Platform.select({
    android: 'Roboto',
    default: 'Plus Jakarta Sans',
  }),
  mono: Platform.select({
    android: 'monospace',
    default: 'Source Code Pro',
  }),
} as const;

export const FontSize = {
  micro: 10,
  caption: 11,
  hint: 12,
  base13: 13,
  body: 14,
  label: 15,
  bodyLg: 16,
  body17: 17,
  heading: 19,
  greeting: 20,
  button: 22,
  title: 26,
  hero: 30,
} as const;

export const FontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;

export const LetterSpacing = {
  hero: 0.4,
  heading: -0.3,
  base: 0,
  badge: 1.0,
  loose: 1.2,
} as const;

export const Typography = {
  hero: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.black,
    letterSpacing: LetterSpacing.hero,
    fontFamily: FontFamily.sans,
  },
  title: {
    fontSize: FontSize.title,
    fontWeight: FontWeight.extrabold,
    letterSpacing: LetterSpacing.heading,
    fontFamily: FontFamily.sans,
  },
  heading: {
    fontSize: FontSize.heading,
    fontWeight: FontWeight.extrabold,
    letterSpacing: LetterSpacing.heading,
    fontFamily: FontFamily.sans,
  },
  greeting: {
    fontSize: FontSize.greeting,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.sans,
  },
  button: {
    fontSize: FontSize.button,
    fontWeight: FontWeight.semibold,
    fontFamily: FontFamily.sans,
  },
  label: {
    fontSize: FontSize.label,
    fontWeight: FontWeight.extrabold,
    fontFamily: FontFamily.sans,
  },
  body: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.regular,
    fontFamily: FontFamily.sans,
  },
  bodyMedium: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.medium,
    fontFamily: FontFamily.sans,
  },
  caption: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    fontFamily: FontFamily.sans,
    letterSpacing: LetterSpacing.badge,
  },
  badge: {
    fontSize: FontSize.micro,
    fontWeight: FontWeight.black,
    fontFamily: FontFamily.sans,
    letterSpacing: LetterSpacing.loose,
  },
  mono: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.body,
  },
} as const;
