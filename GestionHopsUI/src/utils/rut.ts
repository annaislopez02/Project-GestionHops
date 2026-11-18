/**
 * Utilidades de limpieza, formateo y validación de RUT chileno.
 */

export function cleanRut(value: string): string {
  return value.replace(/[^0-9kK]/g, '').toUpperCase();
}

export function formatRut(value: string): string {
  const cleaned = cleanRut(value);
  if (cleaned.length <= 1) return cleaned;

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formattedBody}-${dv}`;
}

export function validateRut(value: string): boolean {
  const cleaned = cleanRut(value);
  if (cleaned.length < 8 || cleaned.length > 9) {
    return false;
  }

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  return /^\d+$/.test(body) && /^[0-9K]$/.test(dv);
}