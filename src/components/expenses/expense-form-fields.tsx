// Campos del formulario de gasto. No guarda nada: solo dibuja y avisa cambios.

import { Pressable, StyleSheet, View } from 'react-native';

import { TextField, useErrorColor } from '@/components/products/text-field';
import { DaySelector } from '@/components/summary/day-selector';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { DayNavigation } from '@/hooks/use-day-navigation';
import { useTheme } from '@/hooks/use-theme';
import {
  EXPENSE_CATEGORY_SUGGESTIONS,
  type ExpenseFormErrors,
  type ExpenseFormValues,
} from '@/lib/expense-form';
import {
  MAX_EXPENSE_CATEGORY_LENGTH,
  MAX_EXPENSE_DESCRIPTION_LENGTH,
} from '@/lib/expense-types';

type Props = {
  day: DayNavigation;
  values: ExpenseFormValues;
  errors: ExpenseFormErrors;
  onChange: (field: keyof ExpenseFormValues, value: string) => void;
  /** Avisa al enfocar un campo bajo para que la pantalla se desplace. */
  onFieldFocus?: () => void;
};

export function ExpenseFormFields({
  day,
  values,
  errors,
  onChange,
  onFieldFocus,
}: Props) {
  const theme = useTheme();
  const errorColor = useErrorColor();

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle">Datos del gasto</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        La fecha no puede ser futura.
      </ThemedText>
      <DaySelector
        label={day.label}
        canGoNext={day.canGoNext}
        onPrev={day.goPrev}
        onNext={day.goNext}
      />
      {errors.date ? (
        <ThemedText type="small" style={{ color: errorColor }}>
          {errors.date}
        </ThemedText>
      ) : null}

      <TextField
        label="Categoría"
        value={values.category}
        onChangeText={(text) => onChange('category', text)}
        error={errors.category}
        maxLength={MAX_EXPENSE_CATEGORY_LENGTH}
        placeholder="Ejemplo: Limpieza"
        hint="Toca una sugerencia o escribe la tuya."
      />
      <View style={styles.chips}>
        {EXPENSE_CATEGORY_SUGGESTIONS.map((name) => (
          <Pressable
            key={name}
            onPress={() => onChange('category', name)}
            accessibilityRole="button"
            accessibilityLabel={`Usar categoría ${name}`}
            style={({ pressed }) => [
              styles.chip,
              { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
            ]}>
            <ThemedText type="smallBold">{name}</ThemedText>
          </Pressable>
        ))}
      </View>

      <TextField
        label="Importe"
        value={values.amount}
        onChangeText={(text) => onChange('amount', text)}
        error={errors.amount}
        keyboardType="decimal-pad"
        placeholder="0.00"
        maxLength={12}
      />

      <TextField
        label="Descripción (opcional)"
        value={values.description}
        onChangeText={(text) => onChange('description', text)}
        error={errors.description}
        maxLength={MAX_EXPENSE_DESCRIPTION_LENGTH}
        placeholder="Ejemplo: jabón para el baño"
        onFocus={onFieldFocus}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
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
});
