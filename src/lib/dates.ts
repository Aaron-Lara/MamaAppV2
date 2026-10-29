// Fechas de calendario en texto AAAA-MM-DD, con el día local del teléfono.

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Fecha local del teléfono en formato AAAA-MM-DD (nunca en UTC). */
export function localDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** true solo si el texto es AAAA-MM-DD y esa fecha existe en el calendario. */
export function isValidDateString(value: string): boolean {
  const match = DATE_PATTERN.exec(value);
  if (!match) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1000) {
    return false; // evita el mapeo 0-99 de Date
  }
  // setFullYear normaliza el desborde: 2026-02-30 se vuelve el 2 de marzo.
  const probe = new Date(2000, 0, 1);
  probe.setFullYear(year, month - 1, day);
  return probe.getFullYear() === year && probe.getMonth() === month - 1 && probe.getDate() === day;
}
