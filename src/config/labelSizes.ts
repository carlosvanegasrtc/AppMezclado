/**
 * Catálogo de tamaños de etiqueta.
 * Los `id` deben coincidir con `LabelSize.id` del módulo nativo
 * (android/.../mezcla/label/LabelSize.kt).
 */
export type LabelSizeId = '2x1' | '4x2' | '4x6';

export interface LabelSizeOption {
  id: LabelSizeId;
  /** Nombre corto para la UI, p. ej. 2" × 1". */
  nombre: string;
  /** Qué incluye / cómo se distribuye el contenido. */
  descripcion: string;
  widthIn: number;
  heightIn: number;
}

export const LABEL_SIZES: readonly LabelSizeOption[] = [
  {
    id: '2x1',
    nombre: '2" × 1"',
    descripcion: 'Compacta. Código de barras, código y fórmula con fecha/hora en una línea.',
    widthIn: 2,
    heightIn: 1,
  },
  {
    id: '4x2',
    nombre: '4" × 2"',
    descripcion: 'Mediana. Código de barras amplio; código, fórmula y fecha/hora en líneas separadas.',
    widthIn: 4,
    heightIn: 2,
  },
  {
    id: '4x6',
    nombre: '4" × 6"',
    descripcion: 'Grande (vertical). Código de barras alto, fórmula destacada y fecha/hora con rótulos.',
    widthIn: 4,
    heightIn: 6,
  },
] as const;

export const DEFAULT_LABEL_SIZE: LabelSizeId = '2x1';

export function getLabelSize(id: LabelSizeId): LabelSizeOption {
  return LABEL_SIZES.find((s) => s.id === id) ?? LABEL_SIZES[0];
}

export function isLabelSizeId(value: unknown): value is LabelSizeId {
  return LABEL_SIZES.some((s) => s.id === value);
}
