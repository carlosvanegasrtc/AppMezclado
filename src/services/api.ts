/**
 * Cliente HTTP base.
 * - Inyecta JWT Bearer automáticamente desde SecureStore en cada request.
 * - Borra el token en respuestas 401.
 * - Centraliza el tratamiento de errores de red.
 */
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import * as SecureStore from 'expo-secure-store';
import { buildBaseUrl } from '@config/api.config';
import type { ApiResponse } from '@/types/api';

const TOKEN_KEY = 'auth_token';

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: buildBaseUrl(),
    timeout: 20_000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  client.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      if (error.response?.status === 401) {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
      return Promise.reject(error);
    }
  );

  return client;
}

export const apiClient: AxiosInstance = createApiClient();

export const tokenStorage = {
  set: (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token),
  get: () => SecureStore.getItemAsync(TOKEN_KEY),
  remove: () => SecureStore.deleteItemAsync(TOKEN_KEY),
};

/**
 * Helper genérico para extraer la data de la respuesta tipada.
 * Lanza error con mensaje del backend si `ok=false`.
 */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<T>(config);
  return response.data;
}

/**
 * Variante para endpoints que devuelven `{ ok, data, ... }`.
 * Lanza si `ok=false`.
 */
export async function requestOk<T = unknown>(
  config: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.request<ApiResponse<T>>(config);
    if (response.data && response.data.ok === false) {
      const msg =
        (response.data as any).message ||
        (response.data as any).error ||
        'Error en el servidor';
      throw new Error(msg);
    }
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      const data: any = err.response.data;
      throw new Error(data.message || data.error || err.message);
    }
    throw err;
  }
}
