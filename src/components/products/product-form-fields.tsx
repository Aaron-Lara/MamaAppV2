import { StyleSheet, Switch, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ProductFormErrors, ProductFormValues, ProductFormVisibility } from '@/lib/product-form';

type Props = {
  values: ProductFormValues;
  errors: ProductFormErrors;
  visibility: ProductFormVisibility;
  onChange: (field: keyof ProductFormValues, value: string | boolean) => void;
};

export function ProductFormFields({ values, errors, visibility, onChange }: Props) {
  const theme = useTheme();

  const inputStyle = [
    styles.input,
    { backgroundColor: theme.backgroundElement, color: theme.text },
  ];
  const errorStyle = { color: '#FF3B30' };

  return (
    <View style={styles.container}>
      <ThemedText>Nombre</ThemedText>
      <TextInput
        value={values.name}
        onChangeText={(v) => onChange('name', v)}
        style={inputStyle}
      />
      {errors.name && <ThemedText style={errorStyle}>{errors.name}</ThemedText>}

      <ThemedText>Precio</ThemedText>
      <TextInput
        value={values.price}
        onChangeText={(v) => onChange('price', v)}
        keyboardType="decimal-pad"
        style={inputStyle}
      />
      {errors.price && <ThemedText style={errorStyle}>{errors.price}</ThemedText>}

      <ThemedText>Categoría (opcional)</ThemedText>
      <TextInput
        value={values.category}
        onChangeText={(v) => onChange('category', v)}
        style={inputStyle}
      />
      {errors.category && <ThemedText style={errorStyle}>{errors.category}</ThemedText>}

      <View style={styles.row}>
        <ThemedText>Controlar stock</ThemedText>
        <Switch
          value={values.trackStock}
          onValueChange={(v) => onChange('trackStock', v)}
        />
      </View>

      {visibility.showMinStock && (
        <>
          <ThemedText>Mínimo de aviso</ThemedText>
          <TextInput
            value={values.minStock}
            onChangeText={(v) => onChange('minStock', v)}
            keyboardType="number-pad"
            style={inputStyle}
          />
          {errors.minStock && <ThemedText style={errorStyle}>{errors.minStock}</ThemedText>}
        </>
      )}

      {visibility.showStockCount && (
        <>
          <ThemedText>{visibility.stockCountLabel}</ThemedText>
          <TextInput
            value={values.stockCount}
            onChangeText={(v) => onChange('stockCount', v)}
            keyboardType="number-pad"
            style={inputStyle}
          />
          <ThemedText type="small">Cuántas unidades hay ahora</ThemedText>
          {errors.stockCount && <ThemedText style={errorStyle}>{errors.stockCount}</ThemedText>}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
  },
  row: {
    minHeight: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
