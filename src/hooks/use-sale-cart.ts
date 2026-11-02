// Carrito de la pantalla Vender. El reducer nunca lanza: los errores de
// las reglas de src/lib/cart.ts se guardan en el estado para mostrarlos.

import { useCallback, useMemo, useReducer } from 'react';

import {
  addProduct,
  cartTotalCents,
  cartUnitCount,
  changeQuantity,
  emptyCart,
  removeLine,
  type Cart,
  type CartProduct,
} from '@/lib/cart';

type SaleCartState = { cart: Cart; error: string | null };

type SaleCartAction =
  | { type: 'add'; product: CartProduct }
  | { type: 'changeQuantity'; key: string; delta: number }
  | { type: 'removeLine'; key: string }
  | { type: 'clear' }
  | { type: 'clearError' };

const initialState: SaleCartState = { cart: emptyCart(), error: null };

function messageOf(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : 'No se pudo actualizar la venta.';
}

function reducer(state: SaleCartState, action: SaleCartAction): SaleCartState {
  try {
    switch (action.type) {
      case 'add':
        return { cart: addProduct(state.cart, action.product), error: null };
      case 'changeQuantity':
        return {
          cart: changeQuantity(state.cart, action.key, action.delta),
          error: null,
        };
      case 'removeLine':
        return { cart: removeLine(state.cart, action.key), error: null };
      case 'clear':
        return { cart: emptyCart(), error: null };
      case 'clearError':
        return { ...state, error: null };
      default:
        return state;
    }
  } catch (error) {
    return { ...state, error: messageOf(error) };
  }
}

export type SaleCart = {
  cart: Cart;
  totalCents: number;
  unitCount: number;
  error: string | null;
  add: (product: CartProduct) => void;
  changeQuantity: (key: string, delta: number) => void;
  removeLine: (key: string) => void;
  clear: () => void;
  clearError: () => void;
};

export function useSaleCart(): SaleCart {
  const [state, dispatch] = useReducer(reducer, initialState);

  const add = useCallback((product: CartProduct) => {
    dispatch({ type: 'add', product });
  }, []);
  const change = useCallback((key: string, delta: number) => {
    dispatch({ type: 'changeQuantity', key, delta });
  }, []);
  const remove = useCallback((key: string) => {
    dispatch({ type: 'removeLine', key });
  }, []);
  const clear = useCallback(() => {
    dispatch({ type: 'clear' });
  }, []);
  const clearError = useCallback(() => {
    dispatch({ type: 'clearError' });
  }, []);

  const totalCents = useMemo(() => cartTotalCents(state.cart), [state.cart]);
  const unitCount = useMemo(() => cartUnitCount(state.cart), [state.cart]);

  return {
    cart: state.cart,
    totalCents,
    unitCount,
    error: state.error,
    add,
    changeQuantity: change,
    removeLine: remove,
    clear,
    clearError,
  };
}
