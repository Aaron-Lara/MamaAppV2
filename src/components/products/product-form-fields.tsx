// Campos del formulario de productos. No guarda nada: solo dibuja y avisa cambios.

import { StyleSheet, Switch, View } from 'react-native';

import { TextField, useErrorColor } from '@/components/products/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type {
  ProductFormErrors,
  ProductFormValues,
  ProductFormVisibility,
} from '@/lib/product-form';

type Props = {
  values: ProductFormValues;
  errors: ProductFormErrors;
  visibility: ProductFormVisibility;
  onChange: (field: keyof ProductFormValues, value: string | boolean) => void;
  onFieldFocus?: () => void;
};

export function ProductFormFields({ values, errors, visibility, onChange, onFieldFocus }: Props) {
  const errorColor = useErrorColor();

  return (
    <View style={styles.container}>
      <TextField
        label="Nombre del producto"
        value={values.name}
        onChangeText={(text) => onChange('name', text)}
        error={errors.name}
        maxLength={60}
      />
      <TextField
        label="Precio"
        value={values.price}
        onChangeText={(text) => onChange('price', text)}
        error={errors.price}
        keyboardType="decimal-pad"
        placeholder="0.00"
        maxLength={9}
      />
      <TextField
        label="Categoría (opcional)"
        value={values.category}
        onChangeText={(text) => onChange('category', text)}
        error={errors.category}
        maxLength={30}
      />

      <View style={styles.row}>
        <ThemedText type="smallBold">Controlar stock</ThemedText>
        <Switch
          value={values.trackStock}
          onValueChange={(value) => onChange('trackStock', value)}
          accessibilityLabel="Controlar stock"
        />
      </View>

      {visibility.showMinStock ? (
        <TextField
          label="Mínimo de aviso"
          value={values.minStock}
          onChangeText={(text) => onChange('minStock', text)}
          error={errors.minStock}
          keyboardType="number-pad"
          maxLength={5}
          onFocus={onFieldFocus}
        />
      ) : null}

      {visibility.showStockCount ? (
        <TextField
          label={visibility.stockCountLabel}
          value={values.stockCount}
          onChangeText={(text) => onChange('stockCount', text)}
          error={errors.stockCount}
          hint="Cuántas unidades hay ahora"
          keyboardType="number-pad"
          maxLength={5}
          onFocus={onFieldFocus}
        />
      ) : null}

      {errors.form ? <ThemedText style={{ color: errorColor }}>{errors.form}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  row: {
    minHeight: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});