// Encabezado de la lista del Resumen: resumen del día y ventas.
// Solo presentación: recibe datos ya cargados y no consulta la base.

import { StyleSheet, View } from 'react-native';

import { ReportsEntryLink } from '@/components/reports/reports-entry-link';
import { DayClosingCard } from '@/components/summary/day-closing-card';
import { SummaryHeader } from '@/components/summary/summary-header';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useDayClosing } from '@/hooks/use-day-closing';
import type { DaySummary } from '@/db/day-summary';
import type { NetProfitEstimate } from '@/lib/profit-estimate';

type Props = {
  label: string;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  summary: DaySummary | null;
  summaryLoading: boolean;
  summaryError: string | null;
  onRetrySummary: () => void;
  profit: NetProfitEstimate | null;
  profitLoading: boolean;
  profitError: string | null;
  onRetryProfit: () => void;
  activeCount: number;
  voidedCount: number;
};

function salesCountLabel(active: number, voided: number): string {
  const sales = active === 1 ? '1 venta' : `${active} ventas`;
  const voidedSales = voided === 1 ? '1 anulada' : `${voided} anuladas`;
  return `${sales} · ${voidedSales}`;
}

export function SummaryListHeader({
  label,
  canGoNext,
  onPrev,
  onNext,
  summary,
  summaryLoading,
  summaryError,
  onRetrySummary,
  profit,
  profitLoading,
  profitError,
  onRetryProfit,
  activeCount,
  voidedCount,
}: Props) {
  const closing = useDayClosing(
    label,
    summary,
    profit,
    profitLoading,
    profitError !== null
  );

  return (
    <View style={styles.header}>
      <SummaryHeader
        label={label}
        canGoNext={canGoNext}
        onPrev={onPrev}
        onNext={onNext}
        summary={summary}
        loading={summaryLoading}
        error={summaryError}
        onRetry={onRetrySummary}
        profit={profit}
        profitLoading={profitLoading}
        profitError={profitError}
        onRetryProfit={onRetryProfit}
      />
      {closing ? <DayClosingCard closing={closing} /> : null}
      <View style={styles.salesHeader}>
        <View style={styles.salesHeaderText}>
          <ThemedText type="smallBold">Ventas del día</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {salesCountLabel(activeCount, voidedCount)}
          </ThemedText>
        </View>
        <ReportsEntryLink />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.three,
  },
  salesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  salesHeaderText: {
    gap: Spacing.half,
  },
});
