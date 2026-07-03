import { describe, test, expect } from '@jest/globals';
import { validateSalesData } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-1034: [edge] 営業データ自動検証ルール定義と異常検出 - 営業データの数値項目が許容範囲の上限値ちょうどの場合、検証OK と判定される
  test('数値項目が許容範囲の上限値と完全に一致する場合、検証ステータスがOKと判定される', () => {
    const validation_rule = {
      rule_id: 'rule_001',
      field_name: 'amount',
      rule_type: 'numeric_range',
      min_value: 0,
      max_value: 1000000,
      is_required: true,
    };

    const test_data = {
      record_id: 'rec_001',
      amount: 1000000,
      customer_name: 'Test Customer',
      service_type: 'Basic Plan',
    };

    const result = validateSalesData(test_data, validation_rule);

    expect(result.is_valid).toBe(true);
    expect(result.validation_status).toBe('OK');
    expect(result.error_flag).toBe(false);
    expect(result.error_message).toBe('');
    expect(result.field_name).toBe('amount');
    expect(result.actual_value).toBe(1000000);
  });
});