// Campos del ajuste de stock. No guarda nada: solo dibuja y avisa cambios.

import { StyleSheet, TextInput, View, useColorScheme } from 'react-native';

import { MotivePicker } from '@/components/stock/motive-picker';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { AdjustmentErrors, AdjustmentMotive } from '@/lib/stock-adjust';

type Props = {
  countedText: string;
  motive: AdjustmentMotive;
  note: string;
  errors: AdjustmentErrors;
  previewText: string | null;
  onCountedChange: (text: string) => void;
  onMotiveChange: (motive: AdjustmentMotive) => void;
  onNoteChange: (text: string) => void;
  onFieldFocus?: () => void;
};

export function StockAdjustFields({
  countedText,
  motive,
  note,
  errors,
  previewText,
  onCountedChange,
  onMotiveChange,
  onNoteChange,
  onFieldFocus,
}: Props) {
  const theme = useTheme();
  const errorColor = useColorScheme() === 'dark' ? '#ff8a80' : '#c62828';
  const inputStyle = { backgroundColor: theme.backgroundElement, color: theme.text };

  return (
    <>
      <View style={styles.field}>
        <ThemedText type="smallBold">Hay ahora</ThemedText>
        <TextInput
          value={countedText}
          onChangeText={onCountedChange}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="0"
          placeholderTextColor={theme.textSecondary}
          accessibilityLabel="Hay ahora"
          onFocus={onFieldFocus}
          style={[
            styles.input,
            inputStyle,
            { borderColor: errors.counted ? errorColor : theme.textSecondary },
          ]}
        />
        {errors.counted ? (
          <ThemedText type="small" style={{ color: errorColor }}>
            {errors.counted}
          </ThemedText>
        ) : null}
      </View>

      <MotivePicker value={motive} onChange={onMotiveChange} />

      {motive === 'other' ? (
        <View style={styles.field}>
          <ThemedText type="smallBold">Nota</ThemedText>
          <TextInput
            value={note}
            onChangeText={onNoteChange}
            multiline
            maxLength={200}
            placeholder="¿Qué pasó?"
            placeholderTextColor={theme.textSecondary}
            accessibilityLabel="Nota"
            onFocus={onFieldFocus}
            style={[
              styles.input,
              styles.note,
              inputStyle,
              { borderColor: errors.note ? errorColor : theme.textSecondary },
            ]}
          />
          {errors.note ? (
            <ThemedText type="small" style={{ color: errorColor }}>
              {errors.note}
            </ThemedText>
          ) : null}
        </View>
      ) : null}

      {previewText ? <ThemedText type="smallBold">{previewText}</ThemedText> : null}
      {errors.form ? (
        <ThemedText type="small" style={{ color: errorColor }}>
          {errors.form}
        </ThemedText>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.one,
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
  },
  note: {
    minHeight: 96,
    paddingTop: Spacing.three,
    textAlignVertical: 'top',
  },
});
