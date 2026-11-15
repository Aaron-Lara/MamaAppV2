// Tipos del cierre del día. Solo estructuras: no hay acceso a la base ni a
// React. El cierre se arma con datos ya calculados por el Resumen.

import type { DaySummary } from '@/db/day-summary';
import type { NetProfitEstimate } from '@/lib/profit-estimate';

export type ClosingTone = 'default' | 'muted' | 'warning' | 'danger';

export type DayClosingLine = {
  key: string;
  label: string;
  value: string;
  note?: string;
  tone?: ClosingTone;
};

export type DayClosingSection = {
  key: string;
  title: string;
  lines: DayClosingLine[];
};

export type DayClosing = {
  headline: string;
  /** Fecha completa para compartir: "3 de noviembre de 2026". */
  dateLabel: string | null;
  sections: DayClosingSection[];
  warnings: string[];
  /** Hubo ventas, anuladas, abonos o gastos. */
  hasActivity: boolean;
  /** La ganancia todavía se calcula; evita compartir un cierre a medias. */
  profitPending: boolean;
  /** La consulta de ganancia falló; nunca se muestra como cero. */
  profitFailed: boolean;
};

export type DayClosingInput = {
  /** Etiqueta del selector: "Hoy", "Ayer" o "3 de noviembre". */
  label: string;
  summary: DaySummary;
  /** null mientras carga o si falló la consulta de ganancia. */
  profit: NetProfitEstimate | null;
  profitLoading?: boolean;
  /** true si la última consulta de ganancia terminó en error. */
  profitFailed?: boolean;
};
