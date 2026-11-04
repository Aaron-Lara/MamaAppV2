// Navegación por días del Resumen: fechas AAAA-MM-DD y etiquetas en español.
// Lógica pura: el calendario se resuelve con Date.UTC, sin la zona del equipo.

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export const INVALID_DAY_LABEL = 'Fecha inválida';

type DateParts = { year: number; month: number; day: number };

/** Lee AAAA-MM-DD y confirma que esa fecha existe en el calendario. */
function parseDate(value: string): DateParts | null {
  const match = DATE_PATTERN.exec(value);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1000) {
    return null; // evita el mapeo 0-99 de Date
  }
  const probe = new Date(Date.UTC(year, month - 1, day));
  const exists =
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day;
  return exists ? { year, month, day } : null;
}

function toDateString(parts: DateParts): string {
  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');
  return `${parts.year}-${month}-${day}`;
}

/** Suma días con Date.UTC: resuelve meses, años y bisiestos sin usar la zona. */
function addDays(parts: DateParts, delta: number): string {
  const next = new Date(Date.UTC(parts.year, parts.month - 1, parts.day) + delta * MS_PER_DAY);
  return toDateString({
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
  });
}

/** Texto escrito del día; el año solo se muestra si no es el año de hoy. */
function formatWrittenDate(parts: DateParts, todayParts: DateParts | null): string {
  const written = `${parts.day} de ${MONTHS[parts.month - 1]}`;
  if (todayParts && parts.year === todayParts.year) {
    return written;
  }
  return `${written} de ${parts.year}`;
}

/** Cambia de día sin permitir fechas futuras: nunca devuelve algo mayor que hoy. */
export function shiftDay(date: string, delta: number, today: string): string {
  const parts = parseDate(date);
  const todayParts = parseDate(today);
  if (!parts || !todayParts) {
    throw new Error('La fecha no es válida.');
  }
  if (!Number.isSafeInteger(delta)) {
    throw new Error('El cambio de día debe ser un número entero.');
  }
  const next = addDays(parts, delta);
  return next > today ? today : next;
}

/** true solo si se puede avanzar: hay un día válido y todavía no es hoy. */
export function canGoNext(date: string, today: string): boolean {
  return parseDate(date) !== null && parseDate(today) !== null && date < today;
}

/** Etiqueta del selector: "Hoy", "Ayer" o la fecha escrita. */
export function dayLabel(date: string, today: string): string {
  const parts = parseDate(date);
  if (!parts) {
    return INVALID_DAY_LABEL;
  }
  const todayParts = parseDate(today);
  if (!todayParts) {
    return formatWrittenDate(parts, null);
  }
  if (date === today) {
    return 'Hoy';
  }
  if (date === addDays(todayParts, -1)) {
    return 'Ayer';
  }
  return formatWrittenDate(parts, todayParts);
}
