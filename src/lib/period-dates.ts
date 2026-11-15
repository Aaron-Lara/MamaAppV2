// Calendario de reportes: semanas (lunes a domingo) y meses calendario.
// Lógica pura con fechas AAAA-MM-DD y Date.UTC, sin la zona del equipo.

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;
const WEEK_DAYS = 7;
const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export const INVALID_PERIOD_LABEL = 'Periodo inválido';

export type PeriodKind = 'week' | 'month';

/** Rango inclusivo en fechas AAAA-MM-DD. */
export type PeriodRange = {
  kind: PeriodKind;
  start: string; // primer día incluido
  end: string; // último día incluido, ya recortado a hoy
  periodEnd: string; // último día natural, aunque todavía sea futuro
  elapsedDays: number; // días incluidos en [start, end]
  isPartial: boolean; // el rango no cubre todo el periodo natural
};

type DateParts = { year: number; month: number; day: number };

function assertKind(kind: PeriodKind): void {
  if (kind !== 'week' && kind !== 'month') {
    throw new Error('El tipo de periodo no es válido.');
  }
}

/** Lee AAAA-MM-DD y confirma que esa fecha existe en el calendario. */
function parseDate(value: string): DateParts | null {
  const match = DATE_PATTERN.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1000) return null; // evita el mapeo 0-99 de Date
  const probe = new Date(Date.UTC(year, month - 1, day));
  const exists =
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day;
  return exists ? { year, month, day } : null;
}

function mustParse(value: string): DateParts {
  const parts = parseDate(value);
  if (!parts) throw new Error('La fecha no es válida.');
  return parts;
}

function toDateString(parts: DateParts): string {
  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');
  return `${parts.year}-${month}-${day}`;
}

/** Suma días con Date.UTC: resuelve meses, años y bisiestos sin usar la zona. */
function addDays(parts: DateParts, delta: number): string {
  const next = new Date(Date.UTC(parts.year, parts.month - 1, parts.day) + delta * MS_PER_DAY);
  return toDateString({ year: next.getUTCFullYear(), month: next.getUTCMonth() + 1, day: next.getUTCDate() });
}

function daysBetween(from: string, to: string): number {
  const a = mustParse(from);
  const b = mustParse(to);
  const utcFrom = Date.UTC(a.year, a.month - 1, a.day);
  const utcTo = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((utcTo - utcFrom) / MS_PER_DAY);
}

/** Último día natural del periodo que empieza en `start`. */
function naturalEnd(kind: PeriodKind, start: string): string {
  const parts = mustParse(start);
  if (kind === 'week') return addDays(parts, WEEK_DAYS - 1);
  const lastDay = new Date(Date.UTC(parts.year, parts.month, 0)).getUTCDate();
  return toDateString({ year: parts.year, month: parts.month, day: lastDay });
}

/** Primer día del periodo que contiene `date`. La semana empieza en lunes. */
export function periodStart(kind: PeriodKind, date: string): string {
  assertKind(kind);
  const parts = mustParse(date);
  if (kind === 'month') return toDateString({ year: parts.year, month: parts.month, day: 1 });
  const weekday = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
  // getUTCDay: 0 = domingo. El lunes queda a 0, 1, ..., 6 días atrás.
  return addDays(parts, -((weekday + 6) % WEEK_DAYS));
}

/** Periodo que contiene `date`, recortado a hoy; un ancla futura se trata como hoy. */
export function periodRange(kind: PeriodKind, date: string, today: string): PeriodRange {
  assertKind(kind);
  mustParse(date);
  mustParse(today);
  const anchor = date > today ? today : date;
  const start = periodStart(kind, anchor);
  const periodEnd = naturalEnd(kind, start);
  const end = periodEnd > today ? today : periodEnd;
  const elapsedDays = daysBetween(start, end) + 1;
  return { kind, start, end, periodEnd, elapsedDays, isPartial: end < periodEnd };
}

/**
 * Inicio del periodo que está `delta` periodos antes o después del ancla.
 * Nunca devuelve un periodo posterior al que contiene hoy.
 */
export function shiftPeriod(kind: PeriodKind, anchor: string, delta: number, today: string): string {
  assertKind(kind);
  mustParse(anchor);
  mustParse(today);
  if (!Number.isSafeInteger(delta)) {
    throw new Error('El cambio de periodo debe ser un número entero.');
  }
  const start = periodStart(kind, anchor > today ? today : anchor);
  const todayStart = periodStart(kind, today);
  if (delta === 0) return start;

  const parts = mustParse(start);
  let next: string;
  if (kind === 'week') {
    next = addDays(parts, delta * WEEK_DAYS);
  } else {
    const month = new Date(Date.UTC(parts.year, parts.month - 1 + delta, 1));
    next = toDateString({ year: month.getUTCFullYear(), month: month.getUTCMonth() + 1, day: 1 });
  }
  return next > todayStart ? todayStart : next;
}

/** true solo si existe un periodo posterior y no es el de hoy. */
export function canGoNextPeriod(kind: PeriodKind, anchor: string, today: string): boolean {
  if (!parseDate(anchor) || !parseDate(today)) return false;
  assertKind(kind);
  const start = periodStart(kind, anchor > today ? today : anchor);
  return start < periodStart(kind, today);
}

/** Periodo anterior con el mismo avance; se recorta si el anterior es más corto. */
export function previousPeriodRange(range: PeriodRange): PeriodRange {
  const startParts = mustParse(range.start);
  mustParse(range.end);
  if (range.end < range.start) throw new Error('El periodo no es válido.');

  const elapsedDays = daysBetween(range.start, range.end) + 1;
  const prevStart = periodStart(range.kind, addDays(startParts, -1));
  const prevPeriodEnd = naturalEnd(range.kind, prevStart);
  const wantedEnd = addDays(mustParse(prevStart), elapsedDays - 1);
  const end = wantedEnd > prevPeriodEnd ? prevPeriodEnd : wantedEnd;
  return {
    kind: range.kind, start: prevStart, end, periodEnd: prevPeriodEnd,
    elapsedDays: daysBetween(prevStart, end) + 1, isPartial: end < prevPeriodEnd,
  };
}

/** Etiqueta del periodo en español; el año se agrega si no es el de hoy. */
export function periodLabel(range: PeriodRange, today: string): string {
  const startParts = parseDate(range.start);
  const endParts = parseDate(range.end);
  if (!startParts || !endParts) return INVALID_PERIOD_LABEL;
  const todayParts = parseDate(today);
  const written = (parts: DateParts) => `${parts.day} de ${MONTHS[parts.month - 1]}`;
  const suffix = todayParts && startParts.year === todayParts.year ? '' : ` de ${startParts.year}`;

  if (range.kind === 'month') return `${MONTHS[startParts.month - 1]}${suffix}`;
  if (startParts.year !== endParts.year) {
    return `${written(startParts)} de ${startParts.year} al ${written(endParts)} de ${endParts.year}`;
  }
  if (startParts.month !== endParts.month) {
    return `${written(startParts)} al ${written(endParts)}${suffix}`;
  }
  if (startParts.day === endParts.day) return `${written(startParts)}${suffix}`;
  return `${startParts.day} al ${endParts.day} de ${MONTHS[startParts.month - 1]}${suffix}`;
}

/**
 * Inicios de los últimos `count` periodos, del más reciente al más viejo.
 * El primero es siempre el periodo que contiene hoy.
 */
export function recentPeriodStarts(kind: PeriodKind, count: number, today: string): string[] {
  assertKind(kind);
  mustParse(today);
  if (!Number.isSafeInteger(count) || count <= 0) {
    throw new Error('La cantidad de periodos debe ser un entero mayor a cero.');
  }
  const starts: string[] = [];
  let start = periodStart(kind, today);
  for (let index = 0; index < count; index += 1) {
    starts.push(start);
    start = shiftPeriod(kind, start, -1, today);
  }
  return starts;
}
