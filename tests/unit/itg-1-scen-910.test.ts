import { validateBillingAmount } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-910: [error] 請求額計算結果検証機能 - 請求額がマイナス値で、データ検証ルール違反として修正指示が生成される
  test('請求額がマイナス値の場合、データ検証ルール違反として検出され、修正指示が生成される', () => {
    const salesData = {
      customer_id: 'CUST001',
      service_id: 'SVC001',
      billing_period: '2024-01',
      appointment_count: 5,
      contract_amount: 100000,
      discount_rate: 0.2,
      calculated_billing_amount: -20000, // マイナス値
      timestamp: new Date('2024-01-31T23:59:59Z'),
    };

    const result = validateBillingAmount(salesData);

    // 検証ルール違反フラグが立つことを確認
    expect(result.is_valid).toBe(false);

    // 違反項目名を確認
    expect(result.violation_field).toBe('calculated_billing_amount');

    // エラーコードが含まれることを確認
    expect(result.error_code).toBe('BILLING_NEGATIVE_VALUE');

    // 詳細なエラーメッセージが含まれることを確認
    expect(result.error_message).toMatch(/請求額/);

    // 修正指示オブジェクトが生成されることを確認
    expect(result.correction_instruction).toBeDefined();
    expect(result.correction_instruction).not.toBeNull();

    // 修正指示にエラーコードが含まれることを確認
    expect(result.correction_instruction.error_code).toBe('BILLING_NEGATIVE_VALUE');

    // 修正指示に違反項目名が含まれることを確認
    expect(result.correction_instruction.violation_field).toBe('calculated_billing_amount');

    // 修正指示に詳細なエラーメッセージが含まれることを確認
    expect(result.correction_instruction.error_message).toMatch(/マイナス/);

    // 修正指示が正しい構造を持つことを確認
    expect(result.correction_instruction).toEqual(
      expect.objectContaining({
        error_code: 'BILLING_NEGATIVE_VALUE',
        violation_field: 'calculated_billing_amount',
        error_message: expect.any(String),
        customer_id: 'CUST001',
        service_id: 'SVC001',
        billing_period: '2024-01',
        detected_value: -20000,
        valid_range_min: 0,
      })
    );

    // 修正指示のタイムスタンプが記録されることを確認
    expect(result.correction_instruction.detected_at).toBeDefined();
    expect(typeof result.correction_instruction.detected_at).toBe('string');

    // 修正指示の検出状態がPENDINGになっていることを確認
    expect(result.correction_instruction.status).toBe('PENDING');
  });
});