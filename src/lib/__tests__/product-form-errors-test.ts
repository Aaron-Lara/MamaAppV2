import { mapSaveError, SAVE_ERROR_FALLBACK } from '../product-form-errors';

describe('mapSaveError', () => {
  test('un nombre repetido va al campo Nombre', () => {
    const message = 'Ya existe un producto con ese nombre.';
    expect(mapSaveError(new Error(message))).toEqual({ name: message });
  });

  test('los errores del stock inicial van a su campo', () => {
    const message = 'El stock inicial no puede pasar de 10000 unidades.';
    expect(mapSaveError(new Error(message))).toEqual({ stockCount: message });
  });

  test('un producto inexistente se muestra tal cual en el formulario', () => {
    expect(mapSaveError(new Error('El producto no existe.'))).toEqual({
      form: 'El producto no existe.',
    });
  });

  test('cualquier otro error es general y sin texto técnico', () => {
    expect(mapSaveError(new Error('SQLITE_CONSTRAINT: UNIQUE failed'))).toEqual({
      form: SAVE_ERROR_FALLBACK,
    });
    expect(mapSaveError('texto suelto')).toEqual({ form: SAVE_ERROR_FALLBACK });
    expect(mapSaveError(null)).toEqual({ form: SAVE_ERROR_FALLBACK });
  });
});