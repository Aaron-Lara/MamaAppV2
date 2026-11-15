// Navegación de los reportes por semana o mes. No consulta la base.
// El ancla siempre cae dentro del periodo mostrado.

import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { isValidDateString, localDateString } from '@/lib/dates';
import {
  canGoNextPeriod,
  periodLabel,
  periodRange,
  periodStart,
  previousPeriodRange,
  shiftPeriod,
  type PeriodKind,
  type PeriodRange,
} from '@/lib/period-dates';

export type PeriodNavigation = {
  kind: PeriodKind;
  today: string;
  range: PeriodRange;
  previousRange: PeriodRange;
  label: string;
  previousLabel: string;
  isCurrent: boolean;
  isPartial: boolean;
  canGoNext: boolean;
  setKind: (kind: PeriodKind) => void;
  goPrev: () => void;
  goNext: () => void;
  goToPeriod: (start: string) => void;
};

type Selection = {
  kind: PeriodKind;
  anchor: string;
  today: string;
};

export function usePeriodNavigation(): PeriodNavigation {
  const [selection, setSelection] = useState<Selection>(() => {
    const today = localDateString();
    return { kind: 'week', anchor: today, today };
  });

  // NativeTabs deja la pantalla montada: al recuperar foco se actualiza hoy.
  useFocusEffect(
    useCallback(() => {
      const now = localDateString();
      setSelection((prev) =>
        prev.today === now ? prev : { ...prev, today: now }
      );
    }, [])
  );

  const { kind, anchor, today } = selection;
  const range = useMemo(
    () => periodRange(kind, anchor, today),
    [kind, anchor, today]
  );
  const previousRange = useMemo(() => previousPeriodRange(range), [range]);
  const label = periodLabel({ ...range, end: range.periodEnd }, today);
  const previousLabel = periodLabel(previousRange, today);
  const isCurrent = range.start === periodStart(kind, today);

  const move = useCallback((delta: number) => {
    const now = localDateString();

    setSelection((prev) => {
      if (delta > 0 && !canGoNextPeriod(prev.kind, prev.anchor, now)) {
        return prev.today === now ? prev : { ...prev, today: now };
      }
      return {
        kind: prev.kind,
        anchor: shiftPeriod(prev.kind, prev.anchor, delta, now),
        today: now,
      };
    });
  }, []);

  const goPrev = useCallback(() => move(-1), [move]);
  const goNext = useCallback(() => move(1), [move]);

  const setKind = useCallback((next: PeriodKind) => {
    const now = localDateString();

    setSelection((prev) => {
      if (next === prev.kind) {
        return prev.today === now ? prev : { ...prev, today: now };
      }
      return {
        kind: next,
        anchor: prev.anchor > now ? now : prev.anchor,
        today: now,
      };
    });
  }, []);

  const goToPeriod = useCallback((start: string) => {
    const now = localDateString();

    setSelection((prev) => {
      const next = { kind: prev.kind, anchor: prev.anchor, today: now };
      if (!isValidDateString(start) || start > now) {
        return next;
      }

      const nextStart = periodStart(prev.kind, start);
      if (nextStart > periodStart(prev.kind, now)) {
        return next;
      }
      return { ...next, anchor: nextStart };
    });
  }, []);

  return useMemo(
    () => ({
      kind,
      today,
      range,
      previousRange,
      label,
      previousLabel,
      isCurrent,
      isPartial: range.isPartial,
      canGoNext: canGoNextPeriod(kind, anchor, today),
      setKind,
      goPrev,
      goNext,
      goToPeriod,
    }),
    [
      kind,
      today,
      range,
      previousRange,
      label,
      previousLabel,
      isCurrent,
      anchor,
      setKind,
      goPrev,
      goNext,
      goToPeriod,
    ]
  );
}
