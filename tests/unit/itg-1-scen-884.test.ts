import { describe, test, expect } from '@jest/globals';
import { validateSalesData } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-884: [normal] 営業データ品質チェック・必須項目検証 - 営業データの必須項目がすべて入力されている場合、チェック結果『正常』が返される
  test('必須項目がすべて入力されている場合、チェック結果が正常を示す', () => {
    const sales_data = {
      customer_name: '株式会社ABC',
      transaction_date: '2024-01-15',
      amount: 150000,
      product_code: 'PROD-001',
      responsible_person: '営業太郎'
    };

    const result = validateSalesData(sales_data);

    expect(result.status_code).toBe(200);
    expect(result.is_valid).toBe(true);
    expect(result.error_message).toBe('');
    expect(result.validation_errors).toEqual([]);
  });
});