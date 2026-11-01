import {
  LARGE_ADJUSTMENT_UNITS,
  MAX_ADJUSTMENT_QUANTITY,
  MAX_COUNTED_UNITS,
  planAdjustment,
  type AdjustmentPlan,
} from '../stock-adjust';

/** Falla la prueba si el plan no es un cambio; si lo es, lo devuelve. */
function changeOf(plan: AdjustmentPlan) {
  if (!plan.ok || !plan.change) throw new Error('Debía cambiar');
  return plan;
}

describe('planAdjustment: Conteo', () => {
  test('suma cuando hay más unidades', () => {
    expect(planAdjustment(10, 15, 'count')).toEqual({
      ok: true,
      change: true,
      difference: 5,
      reason: 'adjustment',
      note: 'Conteo',
      needsConfirmation: false,
    });
  });

  test('resta cuando hay menos unidades', () => {
    const plan = changeOf(planAdjustment(10, 4, 'count'));
    expect(plan.difference).toBe(-6);
    expect(plan.reason).toBe('adjustment');
    expect(plan.note).toBe('Conteo');
  });

  test('sin diferencia no hay movimiento', () => {
    expect(planAdjustment(10, 10, 'count')).toEqual({
      ok: true,
      change: false,
      message: 'El stock ya es 10.',
    });
  });

  test('un stock actual negativo se corrige igual', () => {
    const plan = changeOf(planAdjustment(-3, 0, 'count'));
    expect(plan.difference).toBe(3);
    expect(plan.needsConfirmation).toBe(false);
  });
});

describe('planAdjustment: Merma', () => {
  test('resta con nota fija', () => {
    const plan = changeOf(planAdjustment(10, 8, 'waste'));
    expect(plan.difference).toBe(-2);
    expect(plan.reason).toBe('waste');
    expect(plan.note).toBe('Merma');
  });

  test('no puede sumar', () => {
    expect(planAdjustment(10, 12, 'waste')).toEqual({
      ok: false,
      error: 'La merma solo puede restar unidades.',
    });
  });

  test('sin diferencia gana el mensaje de stock igual', () => {
    expect(planAdjustment(10, 10, 'waste')).toEqual({
      ok: true,
      change: false,
      message: 'El stock ya es 10.',
    });
  });
});

describe('planAdjustment: Otro', () => {
  test('usa la nota de la usuaria sin espacios', () => {
    const plan = changeOf(planAdjustment(10, 7, 'other', '  se rompieron  '));
    expect(plan.difference).toBe(-3);
    expect(plan.reason).toBe('adjustment');
    expect(plan.note).toBe('se rompieron');
  });

  test('exige nota', () => {
    for (const note of ['', '   ']) {
      expect(planAdjustment(10, 7, 'other', note)).toEqual({
        ok: false,
        error: 'Este movimiento necesita una nota que explique el cambio.',
      });
    }
  });
});

describe('planAdjustment: confirmación y topes', () => {
  test('la frontera de confirmación es 20', () => {
    const below = changeOf(planAdjustment(0, LARGE_ADJUSTMENT_UNITS - 1, 'count'));
    const at = changeOf(planAdjustment(0, LARGE_ADJUSTMENT_UNITS, 'count'));
    const negative = changeOf(planAdjustment(LARGE_ADJUSTMENT_UNITS, 0, 'count'));
    expect(below.needsConfirmation).toBe(false);
    expect(at.needsConfirmation).toBe(true);
    expect(negative.needsConfirmation).toBe(true);
  });

  test('una diferencia mayor al tope se rechaza', () => {
    expect(planAdjustment(0, MAX_ADJUSTMENT_QUANTITY + 1, 'count')).toEqual({
      ok: false,
      error: `Un ajuste no puede cambiar más de ${MAX_ADJUSTMENT_QUANTITY} unidades a la vez.`,
    });
  });

  test('el tope se mide sobre la diferencia, no sobre el conteo', () => {
    const plan = changeOf(planAdjustment(-MAX_ADJUSTMENT_QUANTITY, 0, 'count'));
    expect(plan.difference).toBe(MAX_ADJUSTMENT_QUANTITY);
  });

  test('un conteo inválido no se planea', () => {
    expect(planAdjustment(0, -1, 'count').ok).toBe(false);
    expect(planAdjustment(0, MAX_COUNTED_UNITS + 1, 'count').ok).toBe(false);
    expect(planAdjustment(0, 1.5, 'count').ok).toBe(false);
    expect(planAdjustment(Number.NaN, 1, 'count').ok).toBe(false);
  });
});
