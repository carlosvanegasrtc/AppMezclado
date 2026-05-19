import axios, { AxiosError } from 'axios';

export interface NormalizedError {
  message: string;
  status?: number;
  code?: string;
  isNetworkError: boolean;
  isTimeout: boolean;
}

export function normalizeError(err: unknown): NormalizedError {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<any>;
    const isTimeout = ax.code === 'ECONNABORTED';
    const isNetworkError = !ax.response;
    const data: any = ax.response?.data;

    return {
      message:
        data?.message ||
        data?.error ||
        ax.message ||
        (isTimeout ? 'La solicitud tardó demasiado.' : 'Error de red'),
      status: ax.response?.status,
      code: ax.code,
      isNetworkError,
      isTimeout,
    };
  }

  if (err instanceof Error) {
    return {
      message: err.message,
      isNetworkError: false,
      isTimeout: false,
    };
  }

  return {
    message: 'Error desconocido',
    isNetworkError: false,
    isTimeout: false,
  };
}
