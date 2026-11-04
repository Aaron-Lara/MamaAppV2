// Hora local a partir de created_at (UTC). La conversión es pura: recibe el
// desfase del teléfono, así las pruebas no dependen de la zona del equipo.

export const INVALID_TIME_LABEL = '—';

/**
 * Desfase del teléfono en ese instante, en minutos al este de UTC.
 * getTimezoneOffset devuelve lo contrario (minutos a sumar a lo local para
 * llegar a UTC), por eso se invierte el signo.
 */
export function phoneUtcOffsetMinutes(isoUtc: string): number {
  const epoch = Date.parse(isoUtc);
  if (!Number.isFinite(epoch)) {
    return 0;
  }
  return -new Date(epoch).getTimezoneOffset();
}

/** Hora "HH:MM" en la zona indicada; '—' si el texto no es una fecha ISO. */
export function formatLocalTime(isoUtc: string, utcOffsetMinutes: number): string {
  const epoch = Date.parse(isoUtc);
  if (!Number.isFinite(epoch)) {
    return INVALID_TIME_LABEL;
  }
  if (!Number.isFinite(utcOffsetMinutes)) {
    throw new Error('El desfase horario no es válido.');
  }
  const local = new Date(epoch + utcOffsetMinutes * 60_000);
  const hours = String(local.getUTCHours()).padStart(2, '0');
  const minutes = String(local.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/** Atajo para pantallas: usa el desfase real del teléfono en ese instante. */
export function formatLocalTimeForPhone(isoUtc: string): string {
  return formatLocalTime(isoUtc, phoneUtcOffsetMinutes(isoUtc));
}
