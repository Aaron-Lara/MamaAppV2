import {
  MAX_CUSTOMER_NAME_LENGTH,
  customerNameKey,
  hasDuplicateCustomerName,
  validateCustomerName,
} from '../customer-input';

describe('validateCustomerName', () => {
  test('recorta y junta los espacios repetidos', () => {
    expect(validateCustomerName('  Ana   López ')).toBe('Ana López');
  });

  test('acepta el largo máximo', () => {
    const name = 'x'.repeat(MAX_CUSTOMER_NAME_LENGTH);
    expect(validateCustomerName(name)).toBe(name);
  });

  test.each(['', '   ', '\n\t', 'x'.repeat(MAX_CUSTOMER_NAME_LENGTH + 1)])(
    'rechaza %p',
    (name) => {
      expect(() => validateCustomerName(name)).toThrow();
    }
  );
});

describe('customerNameKey y hasDuplicateCustomerName', () => {
  test('ignora mayúsculas, acentos y espacios repetidos', () => {
    expect(customerNameKey('José  PÉREZ')).toBe('jose perez');
    expect(customerNameKey(' Ana ')).toBe(customerNameKey('ana'));
  });

  test('detecta nombres repetidos aunque cambien acentos o mayúsculas', () => {
    const existing = ['Ana López', 'Maestra Elena'];
    expect(hasDuplicateCustomerName('ana lopez', existing)).toBe(true);
    expect(hasDuplicateCustomerName('MAESTRA   ELENA', existing)).toBe(true);
  });

  test('nombres distintos no son duplicado', () => {
    expect(hasDuplicateCustomerName('Ana López 2', ['Ana López'])).toBe(false);
    expect(hasDuplicateCustomerName('Ana', [])).toBe(false);
  });
});