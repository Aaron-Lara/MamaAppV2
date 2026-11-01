// Lógica pura del formulario de productos: de lo que escribe la usuaria a un
// producto válido. No importa expo-sqlite ni nada de pantallas.

import { centsToInputText, parseMoneyToCents } from '@/lib/money-input';
import {
  fieldForRuleError,
  messageOf,
  parseWholeNumber,
} from '@/lib/product-form-helpers';
import { validateProductInput } from '@/lib/product-input';

export type ProductFormMode = 'create' | 'edit';

/** Todo lo que se teclea se guarda como texto hasta el momento de guardar. */
export type ProductFormValues = {
  name: string;
  price: string;
  category: string;
  trackStock: boolean;
  minStock: string;
  /** Stock inicial (alta) o conteo actual (al activar el control en edición). */
  stockCount: string;
};

export type ProductFormField = 'name' | 'price' | 'category' | 'minStock' | 'stockCount' | 'form';
export type ProductFormErrors = Partial<Record<ProductFormField, string>>;

export type ProductFormSource = {
  name: string;
  price_cents: number;
  category: string | null;
  track_stock: number;
  min_stock: number;
};

export type ProductFormVisibility = {
  showMinStock: boolean;
  showStockCount: boolean;
  stockCountLabel: string;
};

type ValidProduct = ReturnType<typeof validateProductInput>;

export type ProductFormResult =
  | { ok: true; input: ValidProduct; stockCount: number | null }
  | { ok: false; errors: ProductFormErrors };

export function emptyProductForm(): ProductFormValues {
  return { name: '', price: '', category: '', trackStock: false, minStock: '0', stockCount: '' };
}

/** Rellena el formulario con un producto existente (para editarlo). */
export function productToFormValues(product: ProductFormSource): ProductFormValues {
  return {
    name: product.name,
    price: centsToInputText(product.price_cents),
    category: product.category ?? '',
    trackStock: product.track_stock === 1,
    minStock: String(product.min_stock),
    stockCount: '',
  };
}

/** Qué campos mostrar según el modo y si el producto ya controlaba stock. */
export function getFormVisibility(
  values: ProductFormValues,
  mode: ProductFormMode,
  originalTrackStock: boolean
): ProductFormVisibility {
  const needsCount = values.trackStock && (mode === 'create' || !originalTrackStock);
  return {
    showMinStock: values.trackStock,
    showStockCount: needsCount,
    stockCountLabel: mode === 'create' ? 'Stock inicial' : 'Conteo actual',
  };
}

export function validateProductForm(
  values: ProductFormValues,
  mode: ProductFormMode,
  originalTrackStock: boolean
): ProductFormResult {
  const errors: ProductFormErrors = {};
  const visibility = getFormVisibility(values, mode, originalTrackStock);

  if (values.name.trim() === '') {
    errors.name = 'Escribe el nombre del producto.';
  }

  let priceCents = 0;
  try {
    priceCents = parseMoneyToCents(values.price);
    if (priceCents === 0) {
      errors.price = 'El precio debe ser mayor a cero.';
    }
  } catch (error) {
    errors.price = messageOf(error);
  }

  let minStock = 0;
  if (visibility.showMinStock) {
    try {
      minStock = parseWholeNumber(values.minStock, 'El mínimo de aviso');
    } catch (error) {
      errors.minStock = messageOf(error);
    }
  }

  let stockCount = 0;
  if (visibility.showStockCount) {
    if (mode === 'edit' && values.stockCount.trim() === '') {
      errors.stockCount = 'Escribe cuántas unidades hay ahora (puede ser 0).';
    } else {
      try {
        stockCount = parseWholeNumber(values.stockCount, 'La cantidad');
      } catch (error) {
        errors.stockCount = messageOf(error);
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  try {
    const input = validateProductInput({
      name: values.name,
      priceCents,
      category: values.category.trim() === '' ? null : values.category,
      trackStock: values.trackStock,
      minStock,
    });
    const sendsCount = visibility.showStockCount && (mode === 'edit' || stockCount > 0);
    return { ok: true, input, stockCount: sendsCount ? stockCount : null };
  } catch (error) {
    const message = messageOf(error);
    return { ok: false, errors: { [fieldForRuleError(message)]: message } };
  }
}