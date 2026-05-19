/**
 * Constantes globales de la app.
 */
export const APP_NAME = 'Rototec Mezcla';
export const APP_VERSION = '1.0.0';

/**
 * Posición ID 9 = "Operario Mezclador" en RHINOTEC.
 * Es el rol esperado de los operarios que usan esta app.
 */
export const ROLES = {
  OPERARIO_MEZCLADOR: 9,
  JEFE_TURNO: 26,
  JEFE_PRODUCCION: 8,
  ENCARGADO_BODEGA: 28,
} as const;

/**
 * Estados de orden de mezcla. Espejo de tEstadosMezcla en BD.
 */
export const ESTADOS_MEZCLA = {
  PLANIFICADA: 'PLANIFICADA',
  AUTORIZADA: 'AUTORIZADA',
  EN_PROCESO: 'EN_PROCESO',
  COMPLETADA: 'COMPLETADA',
  CANCELADA: 'CANCELADA',
  INCOMPLETA: 'INCOMPLETA',
} as const;
