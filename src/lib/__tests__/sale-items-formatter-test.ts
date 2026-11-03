import { formatSaleItemsText } from '../sale-items-formatter';

describe('formatSaleItemsText', () => {
  it('formats multiple items', () => {
    const items = [
      { quantity: 2, description: 'Coca Cola' },
      { quantity: 1, description: 'Lonche' },
    ];
    expect(formatSaleItemsText(items)).toBe('2 x Coca Cola, 1 x Lonche');
  });

  it('formats single item', () => {
    const items = [{ quantity: 3, description: 'Dulces' }];
    expect(formatSaleItemsText(items)).toBe('3 x Dulces');
  });

  it('handles empty', () => {
    expect(formatSaleItemsText([])).toBe('');
  });
});
