// Navegación del día seleccionado en el Resumen. El día inicial es hoy.

import { useCallback, useMemo, useState } from 'react';

import {
  canGoNext as canGoNextDay,
  dayLabel,
  shiftDay,
} from '@/lib/day-navigation';
import { localDateString } from '@/lib/dates';

export type DayNavigation = {
  date: string;
  label: string;
  isToday: boolean;
  canGoNext: boolean;
  goPrev: () => void;
  goNext: () => void;
};

export function useDayNavigation(): DayNavigation {
  const [date, setDate] = useState(() => localDateString());
  // Se recalcula en cada render: si la pantalla sigue abierta pasada la
  // medianoche, "hoy" no se queda congelado en el día anterior.
  const today = localDateString();

  const goPrev = useCallback(() => {
    setDate((current) => shiftDay(current, -1, localDateString()));
  }, []);

  const goNext = useCallback(() => {
    setDate((current) => {
      const currentToday = localDateString();
      if (!canGoNextDay(current, currentToday)) {
        return current;
      }
      return shiftDay(current, 1, currentToday);
    });
  }, []);

  return useMemo(
    () => ({
      date,
      label: dayLabel(date, today),
      isToday: date === today,
      canGoNext: canGoNextDay(date, today),
      goPrev,
      goNext,
    }),
    [date, today, goPrev, goNext]
  );
}
