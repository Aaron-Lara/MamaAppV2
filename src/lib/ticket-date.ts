// Detección de la fecha del ticket. Se normaliza a AAAA-MM-DD y se valida
// contra el calendario real. La fecha es informativa: no cambia el formulario.

import { isValidDateString } from './dates';
import { foldText } from './ticket-text';
import type { TicketWarning } from './ticket-types';

export type TicketDateResult = {
  date: string | null;
  raw: string | null;
  ambiguous: boolean;
};

const MONTHS: Record<string, number> = {
  ENE: 1,
  FEB: 2,
  MAR: 3,
  ABR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AGO: 8,
  SEP: 9,
  SET: 9,
  OCT: 10,
  NOV: 11,
  DIC: 12,
};

// Primero AAAA-MM-DD; después DD/MM/AAAA o DD/MM/AA.
const NUMERIC_DATE =
  /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})|(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/g;
const TEXT_DATE = /(\d{1,2})\s*(?:DE\s+)?([A-Z]{3,10})\.?\s*(?:DE\s+)?(\d{2,4})/g;

function toIso(year: number, month: number, day: number): string | null {
  if (!Number.isSafeInteger(year) || year < 1000 || year > 9999) {
    return null;
  }
  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return isValidDateString(iso) ? iso : null;
}

function fullYear(value: number): number {
  return value < 100 ? 2000 + value : value;
}

type Candidate = { iso: string | null; raw: string };

function numericCandidates(line: string): Candidate[] {
  const found: Candidate[] = [];
  for (const match of line.matchAll(NUMERIC_DATE)) {
    if (match[1]) {
      found.push({
        iso: toIso(Number(match[1]), Number(match[2]), Number(match[3])),
        raw: match[0],
      });
    } else {
      found.push({
        iso: toIso(
          fullYear(Number(match[6])),
          Number(match[5]),
          Number(match[4])
        ),
        raw: match[0],
      });
    }
  }
  return found;
}

function textCandidates(line: string): Candidate[] {
  const found: Candidate[] = [];
  const folded = foldText(line);
  for (const match of folded.matchAll(TEXT_DATE)) {
    const month = MONTHS[match[2].slice(0, 3)];
    if (!month) {
      continue;
    }
    found.push({
      iso: toIso(fullYear(Number(match[3])), month, Number(match[1])),
      raw: match[0],
    });
  }
  return found;
}

/**
 * Busca la fecha en las primeras líneas. Si hay dos fechas distintas no elige
 * ninguna; si solo hay una inválida la reporta como inválida.
 */
export function findTicketDate(lines: readonly string[]): TicketDateResult {
  const candidates = lines
    .slice(0, 20)
    .flatMap((line) => [...numericCandidates(line), ...textCandidates(line)]);

  const valid = new Map<string, string>();
  let invalidRaw: string | null = null;
  for (const candidate of candidates) {
    if (candidate.iso) {
      if (!valid.has(candidate.iso)) {
        valid.set(candidate.iso, candidate.raw);
      }
    } else if (invalidRaw === null) {
      invalidRaw = candidate.raw;
    }
  }

  const dates = [...valid.keys()];
  if (dates.length === 1) {
    return { date: dates[0], raw: valid.get(dates[0]) ?? null, ambiguous: false };
  }
  if (dates.length > 1) {
    return { date: null, raw: null, ambiguous: true };
  }
  return { date: null, raw: invalidRaw, ambiguous: false };
}

export function ticketDateWarnings(result: TicketDateResult): TicketWarning[] {
  if (result.date) {
    return [];
  }
  if (result.ambiguous) {
    return [
      {
        code: 'date_ambiguous',
        message: 'El ticket trae más de una fecha distinta; no se eligió ninguna.',
      },
    ];
  }
  if (result.raw) {
    return [
      {
        code: 'date_invalid',
        message: 'La fecha del ticket no es válida.',
        rawLine: result.raw,
      },
    ];
  }
  return [
    { code: 'date_missing', message: 'No se detectó la fecha del ticket.' },
  ];
}
