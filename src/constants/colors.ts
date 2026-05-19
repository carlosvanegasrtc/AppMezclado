/**
 * Tokens de color de la app.
 * Espejo de tailwind.config.js para uso en StyleSheet.create de RN.
 *
 * Paleta principal: sky (idéntica a AppCalidad para mantener identidad Rototec).
 */

export const Colors = {
  // ── Brand ──────────────────────────────────────────────
  brand: {
    primary: '#0ea5e9',
    secondary: '#075985',
    accent: '#22d3ee',
  },

  // ── Sky scale ──────────────────────────────────────────
  sky: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    450: '#1eb1f1',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },

  // ── Amber scale (acento de mezcla / advertencias) ─────
  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // ── App tokens ─────────────────────────────────────────
  primary: '#0284c7',
  background: '#FBFBFB',
  backgroundDark: '#181719',
  surface: '#FFFFFF',
  foreground: '#0f172a',
  muted: '#64748b',
  hint: '#94a3b8',

  // ── Gradients ──────────────────────────────────────────
  gradients: {
    header: ['#0c4a6e', '#0369a1', '#0284c7'] as const,
    success: ['#064e3b', '#047857', '#059669'] as const,
    danger: ['#7f1d1d', '#b91c1c', '#dc2626'] as const,
    warning: ['#78350f', '#b45309', '#d97706'] as const,
  },

  // ── Mezcla: estados de orden ───────────────────────────
  estados: {
    planificada: { color: '#7c3aed', bg: '#ede9fe' },
    autorizada: { color: '#0891b2', bg: '#ecfeff' },
    enProceso: { color: '#b45309', bg: '#fef3c7' },
    completada: { color: '#15803d', bg: '#dcfce7' },
    cancelada: { color: '#374151', bg: '#f1f5f9' },
    incompleta: { color: '#b91c1c', bg: '#fef2f2' },
  },

  // ── Semantic ───────────────────────────────────────────
  success: '#16a34a',
  successLight: '#dcfce7',
  warning: '#d97706',
  warningLight: '#fef3c7',
  error: '#dc2626',
  errorLight: '#fef2f2',
  info: '#0891b2',
  infoLight: '#ecfeff',

  // ── Neutrales ──────────────────────────────────────────
  white: '#FFFFFF',
  black: '#181718',
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },

  // ── Sombras ────────────────────────────────────────────
  shadow: {
    soft: 'rgba(0, 0, 0, 0.06)',
    medium: 'rgba(0, 0, 0, 0.12)',
    hard: 'rgba(0, 0, 0, 0.20)',
    brand: 'rgba(3, 105, 161, 0.20)',
  },

  // ── Overlays ───────────────────────────────────────────
  overlay: {
    light: 'rgba(255, 255, 255, 0.12)',
    medium: 'rgba(255, 255, 255, 0.22)',
    backdrop: 'rgba(0, 0, 0, 0.50)',
  },
} as const;

export type EstadoMezclaKey = keyof typeof Colors.estados;
