import { validateSalesData } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  test('SCEN-1297: 営業データ検証ルール実行機能 - 営業データの数値が許容範囲を超過している場合、誤り検出と共に検証エラーが記録される', () => {
    // 許容範囲定義
    const validation_rules = {
      sales_amount: {
        field_name: '売上金額',
        data_type: 'number',
        min_value: 0,
        max_value: 10000000,
        unit: '円'
      }
    };

    // 許容範囲を超過する営業データ
    const sales_data = {
      sales_id: 'SD001',
      customer_id: 'CUST001',
      sales_amount: 15000000,
      sales_date: '2024-01-15',
      service_type: 'service_A'
    };

    // 検証実行
    const result = validateSalesData({
      sales_data: sales_data,
      validation_rules: validation_rules
    });

    // 検証エラーが記録されること
    expect(result.is_valid).toBe(false);
    expect(result.validation_errors).toBeDefined();
    expect(Array.isArray(result.validation_errors)).toBe(true);
    expect(result.validation_errors.length).toBe(1);

    // エラー内容の確認
    const error_entry = result.validation_errors[0];
    expect(error_entry.field_name).toBe('売上金額');
    expect(error_entry.input_value).toBe(15000000);
    expect(error_entry.max_allowed).toBe(10000000);
    expect(error_entry.min_allowed).toBe(0);
    expect(error_entry.error_type).toBe('range_exceeded');
    expect(error_entry.status).toBe('NG');

    // エラーステータス確認
    expect(result.status).toBe('NG');
    expect(result.error_count).toBe(1);

    // 誤り検出が実施されたことを確認
    expect(result.detected_errors).toBeDefined();
    expect(result.detected_errors.length).toBeGreaterThan(0);
    expect(result.detected_errors[0]).toMatch(/売上金額/);
  });
});