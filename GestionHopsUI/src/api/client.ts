import axios, { AxiosError } from 'axios';
import type {
  AlertaStockCritico,
  AlertaVencimiento,
  Bodega,
  BodegaPayload,
  CreateMovimientoPayload,
  Dispositivo,
  DispositivoPayload,
  LoginRequest,
  LoginResponse,
  Movimiento,
} from '../types';
import { TOKEN_STORAGE_KEY } from '../utils/jwt';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

let unauthorizedHandler: (() => void) | null = null;

export function registerUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler;
}

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const requestUrl = error.config?.url ?? '';
    const isLoginRequest = requestUrl.includes('/auth/login');

    if (error.response?.status === 401 && !isLoginRequest && unauthorizedHandler) {
      unauthorizedHandler();
    }

    return Promise.reject(error);
  }
);

export function extractApiErrorMessage(
  error: unknown,
  fallback = 'No se pudo completar la operación.'
): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return `Sin conexión con el servidor (${API_BASE_URL}). Verifique que la API NestJS esté activa.`;
    }
    const data = error.response.data as
      | { message?: string | string[]; error?: string }
      | undefined;

    if (Array.isArray(data?.message)) {
      return data.message.join('. ');
    }
    if (typeof data?.message === 'string' && data.message.trim().length > 0) {
      return data.message;
    }
    if (typeof data?.error === 'string' && data.error.trim().length > 0) {
      return data.error;
    }
    return `Error HTTP ${error.response.status}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export const authApi = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', payload);
    return data;
  },
};

export const dispositivosApi = {
  async getAll(): Promise<Dispositivo[]> {
    const { data } = await apiClient.get<Dispositivo[]>('/dispositivos');
    return Array.isArray(data) ? data : [];
  },

  async getByGs1(codigo: string): Promise<Dispositivo> {
    const encoded = encodeURIComponent(codigo.trim());
    const { data } = await apiClient.get<Dispositivo>(`/dispositivos/gs1/${encoded}`);
    return data;
  },

  async create(payload: DispositivoPayload): Promise<Dispositivo> {
    const { data } = await apiClient.post<Dispositivo>('/dispositivos', payload);
    return data;
  },

  async update(
    id: number,
    payload: Partial<DispositivoPayload>
  ): Promise<Dispositivo> {
    const { data } = await apiClient.patch<Dispositivo>(
      `/dispositivos/${id}`,
      payload
    );
    return data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`/dispositivos/${id}`);
  },
};

export const bodegasApi = {
  async getAll(): Promise<Bodega[]> {
    const { data } = await apiClient.get<Bodega[]>('/bodegas');
    return Array.isArray(data) ? data : [];
  },

  async create(payload: BodegaPayload): Promise<Bodega> {
    const { data } = await apiClient.post<Bodega>('/bodegas', payload);
    return data;
  },
};

export const movimientosApi = {
  async getAll(): Promise<Movimiento[]> {
    const { data } = await apiClient.get<Movimiento[]>('/movimientos');
    return Array.isArray(data) ? data : [];
  },

  async create(payload: CreateMovimientoPayload): Promise<Movimiento> {
    const { data } = await apiClient.post<Movimiento>('/movimientos', payload);
    return data;
  },
};

export const alertasApi = {
  async getStockCritico(): Promise<AlertaStockCritico[]> {
    const { data } = await apiClient.get<AlertaStockCritico[]>(
      '/inventario/alertas/stock-critico'
    );
    return Array.isArray(data) ? data : [];
  },

  async getVencimientos(): Promise<AlertaVencimiento[]> {
    const { data } = await apiClient.get<AlertaVencimiento[]>(
      '/inventario/alertas/vencimientos'
    );
    return Array.isArray(data) ? data : [];
  },
};
