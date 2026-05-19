/**
 * Tipos del flujo de autenticación.
 *
 * Login modo kiosco (operario mezclador):
 *   POST /auth/user/login   body: { loginType: 'PIN', pin: <idEmpleado> }
 *   El backend trata `pin` como `tUsuarios.IdEmpleado` y NO valida contraseña.
 *
 * JWT firmado por `apps/domains/global/auth`:
 * {
 *   idEmpleado, username, codVendSap, rol,
 *   ubicacion: { id, nombre, descripcion },
 *   nombreEmpleado,
 *   permisos: [...], secciones: [...],
 *   iat, exp
 * }
 *
 * Aliases `nombreCompleto` y `idPosicion` se rellenan al setear la sesión para
 * que las pantallas que ya los consumen (Home, Settings, Drawer, etc.) sigan
 * funcionando sin cambios.
 */

export type LoginType = 'USERNAME' | 'PIN';

export interface LoginRequest {
  loginType: LoginType;
  username?: string;
  password?: string;
  /** Para `loginType: 'PIN'` — el backend trata este número como `IdEmpleado`. */
  pin?: number;
}

export interface LoginApiResponse {
  ok: boolean;
  data: string; // JWT
  message?: string;
}

export interface UbicacionPayload {
  id: number;
  nombre: string;
  descripcion?: string;
}

/** Forma cruda del JWT firmado por el backend. */
export interface JWTPayload {
  idEmpleado: number;
  username: string;
  codVendSap?: number | null;
  rol: number;
  ubicacion: UbicacionPayload;
  nombreEmpleado: string;
  permisos: string[];
  secciones: string[];
  iat: number;
  exp: number;

  // ── Aliases derivados (poblados al setear sesión) ───────────────
  /** Alias de `nombreEmpleado`. */
  nombreCompleto?: string;
  /** Alias de `rol` — coincide con `posicion_id` en la mayoría de casos. */
  idPosicion?: number;
  /** Texto de posición (no viene en JWT; queda undefined). */
  posicion?: string;
}

export interface AuthSession {
  payload: JWTPayload;
  token: string;
}
