import { validateSalesData } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質チェック機能', () => {
  // SCEN-873: [normal] 営業データ品質チェック機能 - 営業データの必須項目が全て入力されている場合に正常と判定される
  test('営業データの必須項目が全て入力されている場合、チェック結果は正常と判定される', () => {
    const sales_data = {
      customer_name: '株式会社ABC',
      product_name: 'Premium Service',
      amount: 150000,
      sales_date: '2024-01-15',
      sales_person: '山田太郎',
      status: 'completed'
    };

    const result = validateSalesData(sales_data);

    expect(result.is_valid).toBe(true);
    expect(result.status).toBe('正常');
    expect(result.error_messages).toEqual([]);
    expect(result.can_proceed_to_billing).toBe(true);
  });
});