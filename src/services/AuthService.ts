/**
 * AuthService — Singleton para manejo de sesión.
 *
 * Consume `/api/v2/auth/...` del Gateway que reescribe a `AUTH_URL`.
 */
import { jwtDecode } from 'jwt-decode';
import { request, tokenStorage } from './api';
import type {
  AuthSession,
  JWTPayload,
  LoginApiResponse,
  LoginRequest,
} from '@/types/auth';

class AuthService {
  private static instance: AuthService;
  private readonly LOGIN = '/auth/user/login';

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /** Login estándar con username/password. */
  async loginUsername(username: string, password: string): Promise<AuthSession> {
    const body: LoginRequest = { loginType: 'USERNAME', username, password };
    return this.executeLogin(this.LOGIN, body);
  }

  /**
   * Login del operario por id de empleado (modo kiosco, igual que RototecProduccion).
   * Backend: `POST /auth/user/login` con `{ loginType:'PIN', pin: idEmpleado }`.
   * No valida contraseña — basta con que exista un usuario asociado al id.
   */
  async loginByEmpleadoId(idEmpleado: number): Promise<AuthSession> {
    const body: LoginRequest = { loginType: 'PIN', pin: idEmpleado };
    return this.executeLogin(this.LOGIN, body);
  }

  async logout(): Promise<void> {
    await tokenStorage.remove();
  }

  /** Restaura sesión persistida. Si el token está expirado lo borra y devuelve null. */
  async restoreSession(): Promise<JWTPayload | null> {
    const token = await tokenStorage.get();
    if (!token) return null;

    try {
      const raw = jwtDecode<JWTPayload>(token);
      const isExpired = raw.exp * 1000 < Date.now();
      if (isExpired) {
        await tokenStorage.remove();
        return null;
      }
      return {
        ...raw,
        nombreCompleto: raw.nombreEmpleado,
        idPosicion: raw.rol,
      };
    } catch {
      await tokenStorage.remove();
      return null;
    }
  }

  // ── Helpers ──────────────────────────────────────────────
  private async executeLogin(url: string, data: LoginRequest): Promise<AuthSession> {
    const response = await request<LoginApiResponse>({ method: 'POST', url, data });
    if (!response.ok) {
      throw new Error(response.message ?? 'Error al iniciar sesión');
    }
    const raw = jwtDecode<JWTPayload>(response.data);
    const payload: JWTPayload = {
      ...raw,
      nombreCompleto: raw.nombreEmpleado,
      idPosicion: raw.rol,
    };
    await tokenStorage.set(response.data);
    return { payload, token: response.data };
  }
}

export const authService = AuthService.getInstance();
