import { validateSalesDataInput } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-1024: [normal] 営業データ入力時自動検証機能 - 必須項目が入力され、データ型が正しく、値が範囲内の場合、検証が正常に完了する
  test('必須項目が入力され、データ型が正しく、値が範囲内の場合、検証が正常に完了する', () => {
    const input_sales_data = {
      customer_name: '株式会社テスト',
      amount: 100000,
      transaction_date: '2024-01-15',
    };

    const result = validateSalesDataInput(input_sales_data);

    expect(result).toEqual({
      is_valid: true,
      validation_errors: [],
      message: '検証が正常に完了しました',
    });
    expect(result.is_valid).toBe(true);
    expect(result.validation_errors.length).toBe(0);
  });
});