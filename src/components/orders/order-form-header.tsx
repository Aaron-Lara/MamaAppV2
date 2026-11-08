// Encabezado del pedido: cliente, fecha del pedido, entrega y notas.

import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { TextField, useErrorColor } from '@/components/products/text-field';
import { DaySelector } from '@/components/summary/day-selector';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { DayNavigation } from '@/hooks/use-day-navigation';
import { useTheme } from '@/hooks/use-theme';
import { localDateString, localDateStringDaysAgo } from '@/lib/dates';
import { MAX_ORDER_NOTES_LENGTH } from '@/lib/order-input';

type Props = {
  day: DayNavigation;
  customerName: string | null;
  customerError?: string;
  dueDate: string;
  dueError?: string;
  notes: string;
  notesError?: string;
  onOpenCustomers: () => void;
  onDueDateChange: (value: string) => void;
  onNotesChange: (value: string) => void;
};

export function OrderFormHeader({
  day,
  customerName,
  customerError,
  dueDate,
  dueError,
  notes,
  notesError,
  onOpenCustomers,
  onDueDateChange,
  onNotesChange,
}: Props) {
  const theme = useTheme();
  const errorColor = useErrorColor();
  const today = localDateString();
  const quickDates = [
    { label: 'Hoy', value: today },
    { label: 'Mañana', value: localDateStringDaysAgo(-1) },
    { label: 'En 7 días', value: localDateStringDaysAgo(-7) },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <ThemedText type="smallBold">Cliente</ThemedText>
        <Pressable
          onPress={onOpenCustomers}
          accessibilityRole="button"
          accessibilityLabel="Elegir cliente"
          style={({ pressed }) => [
            styles.customer,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: customerError ? errorColor : 'transparent',
              opacity: pressed ? 0.7 : 1,
            },
          ]}>
          <ThemedText
            type={customerName ? 'smallBold' : 'small'}
            themeColor={customerName ? 'text' : 'textSecondary'}
            numberOfLines={1}>
            {customerName ?? 'Elegir cliente'}
          </ThemedText>
        </Pressable>
        {customerError ? (
          <ThemedText type="small" style={{ color: errorColor }}>
            {customerError}
          </ThemedText>
        ) : null}
      </View>

      <View style={styles.field}>
        <ThemedText type="smallBold">Fecha del pedido</ThemedText>
        <DaySelector
          label={day.label}
          canGoNext={day.canGoNext}
          onPrev={day.goPrev}
          onNext={day.goNext}
        />
      </View>

      <View style={styles.field}>
        <TextField
          label="Fecha de entrega (opcional)"
          value={dueDate}
          onChangeText={onDueDateChange}
          error={dueError}
          hint="Formato AAAA-MM-DD. Puedes dejarla vacía."
          placeholder="2026-11-15"
        />
        <View style={styles.chips}>
          {quickDates.map((option) => {
            const selected = dueDate.trim() === option.value;
            return (
              <Pressable
                key={option.label}
                onPress={() => onDueDateChange(option.value)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: selected
                      ? theme.backgroundSelected
                      : theme.backgroundElement,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}>
                <ThemedText type={selected ? 'smallBold' : 'small'}>
                  {option.label}
                </ThemedText>
              </Pressable>
            );
          })}
          {dueDate.trim() ? (
            <Pressable
              onPress={() => onDueDateChange('')}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.chip,
                { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
              ]}>
              <ThemedText type="small">Quitar</ThemedText>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.field}>
        <ThemedText type="smallBold">Notas (opcional)</ThemedText>
        <TextInput
          value={notes}
          onChangeText={onNotesChange}
          placeholder="Por ejemplo: entregar después de las 12"
          placeholderTextColor={theme.textSecondary}
          accessibilityLabel="Notas del pedido"
          multiline
          maxLength={MAX_ORDER_NOTES_LENGTH}
          textAlignVertical="top"
          style={[
            styles.notes,
            {
              backgroundColor: theme.backgroundElement,
              color: theme.text,
              borderColor: notesError ? errorColor : 'transparent',
            },
          ]}
        />
        {notesError ? (
          <ThemedText type="small" style={{ color: errorColor }}>
            {notesError}
          </ThemedText>
        ) : null}
      </View>

      <ThemedText type="smallBold">Productos</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  field: {
    gap: Spacing.one,
  },
  customer: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
  },
  notes: {
    minHeight: 96,
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.three,
    fontSize: 16,
  },
});
