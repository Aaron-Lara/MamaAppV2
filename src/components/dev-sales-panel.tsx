// TEMPORAL: panel de pruebas de recordSale. Se borra cuando terminemos.

import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { DEV_CASES, runDevCase, type DevCaseId } from '@/components/dev-sales-cases';
import { DevSalesReport } from '@/components/dev-sales-report';
import { DEV_STOCK_CASES, isStockCase, runStockCase, type DevStockCaseId } from '@/components/dev-stock-cases';
import { DEV_VOID_CASES, isVoidCase, runVoidCase, type DevVoidCaseId } from '@/components/dev-void-cases';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { getSalesSummary, type SalesSummary } from '@/db/sales-summary';
import { useTheme } from '@/hooks/use-theme';

const EMPTY_SUMMARY: SalesSummary = {
  salesCount: 0,
  saleItemsCount: 0,
  customersCount: 0,
  recentSales: [],
};

type AnyCaseId = DevCaseId | DevStockCaseId | DevVoidCaseId;

const ALL_CASES = [...DEV_CASES, ...DEV_STOCK_CASES, ...DEV_VOID_CASES];

function errorText(err: unknown): string {
  return err instanceof Error ? err.message : 'Error desconocido.';
}

export function DevSalesPanel() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const [summary, setSummary] = useState<SalesSummary>(EMPTY_SUMMARY);
  const [busyId, setBusyId] = useState<AnyCaseId | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const refresh = useCallback(async () => {
    try {
      setSummary(await getSalesSummary(db));
    } catch (err) {
      setMessage({ ok: false, text: errorText(err) });
    }
  }, [db]);

  // Carga inicial: el setState va en el callback, no en el cuerpo del efecto.
  useEffect(() => {
    let active = true;
    getSalesSummary(db).then(
      (next) => {
        if (active) setSummary(next);
      },
      (err: unknown) => {
        if (active) setMessage({ ok: false, text: errorText(err) });
      }
    );
    return () => {
      active = false;
    };
  }, [db]);

  const run = async (id: AnyCaseId) => {
    setBusyId(id);
    try {
      const result = isStockCase(id)
        ? await runStockCase(db, id)
        : isVoidCase(id)
          ? await runVoidCase(db, id)
          : await runDevCase(db, id);
      setMessage({ ok: result.ok, text: result.message });
      await refresh();
    } catch (err) {
      setMessage({ ok: false, text: errorText(err) });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="smallBold">Panel de pruebas · recordSale y stock</ThemedText>
      <DevSalesReport summary={summary} />

      {ALL_CASES.map((testCase) => (
        <Pressable
          key={testCase.id}
          onPress={() => run(testCase.id)}
          disabled={busyId !== null}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: theme.backgroundElement,
              opacity: busyId !== null ? 0.5 : pressed ? 0.7 : 1,
            },
          ]}>
          <ThemedText type="smallBold">
            {busyId === testCase.id ? 'Ejecutando…' : testCase.label}
          </ThemedText>
          <ThemedText type="code" themeColor="textSecondary">
            Esperado: {testCase.expected}
          </ThemedText>
        </Pressable>
      ))}

      <Pressable
        onPress={refresh}
        disabled={busyId !== null}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.7 : 1 },
        ]}>
        <ThemedText type="smallBold">Actualizar conteos</ThemedText>
      </Pressable>

      {message ? (
        <ThemedText type="small" style={message.ok ? styles.ok : styles.error}>
          {message.text}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  button: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
    gap: Spacing.half,
  },
  ok: {
    color: '#1a7f37',
  },
  error: {
    color: '#d93025',
  },
});
