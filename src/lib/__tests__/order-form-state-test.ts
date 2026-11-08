// Pruebas de los reductores del formulario de pedidos.

import {
  addOrderLine,
  removeOrderLine,
  selectOrderLineProduct,
  updateOrderLine,
} from '../order-form-state';
import { emptyOrderForm, type OrderFormValues } from '../order-form-types';

const TODAY = '2026-11-06';

function form(): OrderFormValues {
  return emptyOrderForm(TODAY);
}

describe('reductores del formulario de pedidos', () => {
  test('actualiza solo el renglón indicado', () => {
    const next = updateOrderLine(form(), 'line-1', {
      description: 'Pan',
      quantity: '3',
    });
    expect(next.lines[0]).toMatchObject({ description: 'Pan', quantity: '3' });
  });

  test('agrega y quita renglones, conservando al menos uno', () => {
    const added = addOrderLine(form(), 'line-2');
    expect(added.lines).toHaveLength(2);
    expect(added.lines[1].key).toBe('line-2');

    const removed = removeOrderLine(added, 'line-1');
    expect(removed.lines.map((line) => line.key)).toEqual(['line-2']);

    expect(removeOrderLine(form(), 'line-1').lines).toHaveLength(1);
  });

  test('al elegir producto precarga nombre y precio', () => {
    const next = selectOrderLineProduct(form(), 'line-1', {
      id: 8,
      name: 'Jugo',
      priceCents: 750,
    });
    expect(next.lines[0]).toMatchObject({
      productId: 8,
      productName: 'Jugo',
      description: 'Jugo',
      unitPrice: '7.50',
    });
  });

  test('respeta una descripción propia al cambiar de producto', () => {
    const withDescription = updateOrderLine(form(), 'line-1', {
      description: 'Sin azúcar',
      productId: 8,
      productName: 'Jugo',
    });
    const next = selectOrderLineProduct(withDescription, 'line-1', {
      id: 9,
      name: 'Agua',
      priceCents: 500,
    });
    expect(next.lines[0]).toMatchObject({
      productId: 9,
      productName: 'Agua',
      description: 'Sin azúcar',
      unitPrice: '5.00',
    });
  });

  test('al quitar el producto conserva descripción y precio', () => {
    const withProduct = selectOrderLineProduct(form(), 'line-1', {
      id: 8,
      name: 'Jugo',
      priceCents: 750,
    });
    const next = selectOrderLineProduct(withProduct, 'line-1', null);
    expect(next.lines[0]).toMatchObject({
      productId: null,
      productName: null,
      description: 'Jugo',
      unitPrice: '7.50',
    });
  });
});
