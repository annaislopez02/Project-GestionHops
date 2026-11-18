export type UserRole = 'ADMIN' | 'JEFE_BODEGA' | 'CLINICO';

export interface JwtPayload {
  sub: number;
  rut: string;
  rol: UserRole;
  nombre?: string;
  iat?: number;
  exp?: number;
}

export interface LoginRequest {
  rut: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface Dispositivo {
  id: number;
  codigo_gs1: string;
  nombre: string;
  categoria: string;
  stock_minimo: number;
}

export interface DispositivoPayload {
  codigo_gs1: string;
  nombre: string;
  categoria: string;
  stock_minimo: number;
}

export interface Bodega {
  id: number;
  nombre: string;
  tipo?: string;
  ubicacion?: string;
}

export interface BodegaPayload {
  nombre: string;
  tipo?: string;
  ubicacion?: string;
}

export type TipoMovimiento = 'INGRESO' | 'SALIDA' | 'TRASPASO';

export interface CreateMovimientoPayload {
  dispositivo_id: number;
  tipo_movimiento: TipoMovimiento;
  bodega_origen_id?: number;
  bodega_destino_id?: number;
  cantidad: number;
  observacion?: string;
}

export interface MovimientoUsuario {
  id: number;
  nombre: string;
  rut: string;
  rol: UserRole;
}

export interface Movimiento {
  id: number;
  dispositivo_id?: number;
  dispositivo?: Dispositivo;
  tipo_movimiento: TipoMovimiento;
  bodega_origen_id?: number | null;
  bodega_origen?: Bodega | null;
  bodega_destino_id?: number | null;
  bodega_destino?: Bodega | null;
  cantidad: number;
  observacion?: string | null;
  fecha_hora: string;
  usuario?: MovimientoUsuario;
}

export interface AlertaStockCritico {
  id?: number;
  dispositivo_id?: number;
  dispositivo?: Dispositivo;
  nombre?: string;
  codigo_gs1?: string;
  bodega?: Bodega;
  bodega_nombre?: string;
  stock_actual?: number;
  cantidad_actual?: number;
  stock?: number;
  stock_minimo?: number;
}

export interface AlertaVencimiento {
  id?: number;
  dispositivo_id?: number;
  dispositivo?: Dispositivo;
  nombre?: string;
  codigo_gs1?: string;
  bodega?: Bodega;
  bodega_nombre?: string;
  lote?: string;
  fecha_vencimiento?: string;
  dias_restantes?: number;
  cantidad?: number;
}

export type DashboardView = 'operacion' | 'catalogo' | 'bodegas';
