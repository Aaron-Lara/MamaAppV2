import { CUSTOMER_SAVE_ERROR, mapCreateCustomerError } from '../customer-messages';
import { MAX_CUSTOMER_NAME_LENGTH } from '../customer-input';

describe('mapCreateCustomerError', () => {
  test('traduce el nombre duplicado', () => {
    const error = new Error('Ya existe un cliente con ese nombre.');
    expect(mapCreateCustomerError(error)).toBe('Ya existe un cliente con ese nombre.');
  });

  test('detecta el duplicado sin importar mayúsculas', () => {
    expect(mapCreateCustomerError(new Error('YA EXISTE un cliente así'))).toBe(
      'Ya existe un cliente con ese nombre.'
    );
  });

  test('traduce el nombre vacío', () => {
    expect(mapCreateCustomerError(new Error('Escribe el nombre del cliente.'))).toBe(
      'Escribe el nombre del cliente.'
    );
  });

  test('traduce el nombre demasiado largo', () => {
    expect(
      mapCreateCustomerError(
        new Error(`El nombre no puede pasar de ${MAX_CUSTOMER_NAME_LENGTH} caracteres.`)
      )
    ).toBe(`El nombre no puede pasar de ${MAX_CUSTOMER_NAME_LENGTH} caracteres.`);
  });

  test('usa el mensaje de respaldo si el error no es un Error', () => {
    expect(mapCreateCustomerError('algo salió mal')).toBe(CUSTOMER_SAVE_ERROR);
    expect(mapCreateCustomerError(null)).toBe(CUSTOMER_SAVE_ERROR);
  });

  test('usa el mensaje de respaldo si el error no es reconocido', () => {
    expect(mapCreateCustomerError(new Error('SQLITE_CONSTRAINT'))).toBe(
      'No se pudo crear el cliente. Inténtalo de nuevo.'
    );
  });
});
