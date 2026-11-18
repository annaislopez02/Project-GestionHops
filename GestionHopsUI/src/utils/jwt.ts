import type { JwtPayload, UserRole } from '../types';

export const TOKEN_STORAGE_KEY = 'gestionhops_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as JwtPayload;

    if (!parsed || typeof parsed.sub !== 'number' || !parsed.rol) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function isTokenExpired(payload: JwtPayload): boolean {
  if (!payload.exp) return false;
  return Date.now() >= payload.exp * 1000;
}

export function canManageCatalog(rol?: UserRole): boolean {
  return rol === 'ADMIN' || rol === 'JEFE_BODEGA';
}

export function getRoleLabel(rol?: UserRole): string {
  switch (rol) {
    case 'ADMIN':
      return 'Administrador';
    case 'JEFE_BODEGA':
      return 'Jefe de Bodega';
    case 'CLINICO':
      return 'Personal Clínico';
    default:
      return 'Sin rol';
  }
}
