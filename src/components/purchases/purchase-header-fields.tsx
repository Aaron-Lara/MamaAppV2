// Encabezado del formulario de compra: fecha, tienda, moneda y tipo de cambio.

import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { TextField } from '@/components/products/text-field';
import { DaySelector } from '@/components/summary/day-selector';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { DayNavigation } from '@/hooks/use-day-navigation';
import { useTheme } from '@/hooks/use-theme';
import type { PurchaseCurrency } from '@/lib/purchase-types';
import { MAX_STORE_LENGTH } from '@/lib/purchase-types';

type Props = {
  day: DayNavigation;
  stores: string[];
  store: string;
  currency: PurchaseCurrency;
  exchangeRate: string;
  storeError?: string;
  rateError?: string;
  onStoreChange: (store: string) => void;
  onCurrencyChange: (currency: PurchaseCurrency) => void;
  onExchangeRateChange: (rate: string) => void;
};

export function PurchaseHeaderFields({
  day,
  stores,
  store,
  currency,
  exchangeRate,
  storeError,
  rateError,
  onStoreChange,
  onCurrencyChange,
  onExchangeRateChange,
}: Props) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle">Datos de la compra</ThemedText>
      <DaySelector
        label={day.label}
        canGoNext={day.canGoNext}
        onPrev={day.goPrev}
        onNext={day.goNext}
      />

      <TextField
        label="Tienda (opcional)"
        value={store}
        onChangeText={onStoreChange}
        error={storeError}
        maxLength={MAX_STORE_LENGTH}
        placeholder="Ejemplo: La Central"
      />
      {stores.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.chips}>
          {stores.map((name) => (
            <Pressable
              key={name}
              onPress={() => onStoreChange(name)}
              accessibilityRole="button"
              accessibilityLabel={`Usar tienda ${name}`}
              style={({ pressed }) => [
                styles.chip,
                { backgroundColor: theme.backgroundElement, borderColor: theme.textSecondary },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold">{name}</ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <ThemedText type="smallBold">Moneda</ThemedText>
      <View style={styles.currencyRow}>
        {(['MXN', 'USD'] as const).map((option) => {
          const selected = currency === option;
          return (
            <Pressable
              key={option}
              onPress={() => onCurrencyChange(option)}
              accessibilityRole="button"
              accessibilityLabel={`Moneda ${option}`}
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.currency,
                {
                  backgroundColor: selected ? theme.primary : theme.backgroundElement,
                  borderColor: selected ? theme.primary : theme.textSecondary,
                },
                pressed && styles.pressed,
              ]}>
              <ThemedText
                type="smallBold"
                style={{ color: selected ? theme.onPrimary : theme.text }}>
                {option}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {currency === 'USD' ? (
        <TextField
          label="Tipo de cambio (pesos por dólar)"
          value={exchangeRate}
          onChangeText={onExchangeRateChange}
          error={rateError}
          keyboardType="decimal-pad"
          placeholder="20.50"
          hint="Se usa para convertir cada producto a pesos."
        />
      ) : null}

      <ThemedText type="smallBold">Productos</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.three },
  chips: { gap: Spacing.two, paddingVertical: Spacing.one },
  chip: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
  },
  currencyRow: { flexDirection: 'row', gap: Spacing.two },
  currency: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
});
