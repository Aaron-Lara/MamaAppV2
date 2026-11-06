// Lista de compras: la más reciente primero, con acceso al formulario.

import { router, type Href } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PurchaseRow } from '@/components/purchases/purchase-row';
import { RetryBlock } from '@/components/summary/retry-block';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { usePurchases } from '@/hooks/use-purchases';
import { useTheme } from '@/hooks/use-theme';
import { localDateString } from '@/lib/dates';
import { buildPurchaseRows } from '@/lib/purchase-rows';

export default function PurchasesScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { items, loading, error, reload } = usePurchases();
  const today = localDateString();
  const rows = useMemo(() => buildPurchaseRows(items, today), [items, today]);
  const firstLoad = loading && items.length === 0;

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[styles.safe, { backgroundColor: theme.background }]}>
      {firstLoad ? (
        <View style={styles.centered}>
          <ActivityIndicator
            size="large"
            color={theme.text}
            accessibilityLabel="Cargando compras"
          />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <RetryBlock message={error} onRetry={() => void reload()} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(row) => String(row.id)}
          renderItem={({ item }) => <PurchaseRow row={item} />}
          keyboardShouldPersistTaps="handled"
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + Spacing.four },
          ]}
          ListEmptyComponent={
            <View style={styles.centered}>
              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={styles.emptyText}>
                Todavía no hay compras.
              </ThemedText>
            </View>
          }
        />
      )}

      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.background,
            paddingBottom: insets.bottom + Spacing.four,
          },
        ]}>
        <Pressable
          onPress={() => router.push('/purchase-form' as Href)}
          accessibilityRole="button"
          accessibilityLabel="Nueva compra"
          style={({ pressed }) => [
            styles.newButton,
            { backgroundColor: theme.text, opacity: pressed ? 0.7 : 1 },
          ]}>
          <ThemedText type="smallBold" style={{ color: theme.background }}>
            + Nueva compra
          </ThemedText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  emptyText: {
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  newButton: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
});
