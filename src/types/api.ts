/**
 * Forma estándar de las respuestas del microservicio produccion-calidad.
 * Todos los handlers devuelven `{ ok: boolean, ... }`.
 */
export interface ApiSuccess<T = unknown> {
  ok: true;
  data?: T;
  message?: string;
  [key: string]: any;
}

export interface ApiError {
  ok: false;
  message?: string;
  error?: string;
  code?: string;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

/**
 * Algunos endpoints (los que vienen directo de SP) devuelven recordsets
 * en `data` o `result` con formato `{ Exitoso: 0|1, Mensaje: string }`.
 */
export interface SpResult {
  Exitoso: 0 | 1;
  Mensaje?: string;
  [key: string]: any;
}
