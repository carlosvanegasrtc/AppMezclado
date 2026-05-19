/**
 * Configuración de iconografía.
 *
 * - 'lucide' (default): usa lucide-react-native (vectorial, profesional)
 * - 'emoji': fallback simple usando emojis nativos del sistema (útil para web/dev rápido)
 *
 * Cambiar `ICON_SET` aquí afecta TODA la app porque los componentes consumen
 * `getIcon(name)` o importan directamente de '@components/ui/Icon'.
 */
export type IconSet = 'lucide' | 'emoji';

export const ICON_SET: IconSet = 'lucide';

/**
 * Configuración común de iconos lucide para la app.
 * strokeWidth y tamaños alineados con el design system.
 */
export const IconDefaults = {
  strokeWidth: 2.2,
  size: {
    xs: 16,
    sm: 18,
    md: 22,
    lg: 24,
    xl: 28,
  },
} as const;
