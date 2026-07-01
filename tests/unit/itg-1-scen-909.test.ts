import { validateInvoiceAmount } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-909: [error] 請求額計算結果検証機能 - 請求額が不正な計算ロジックで算出され、異常値として検出される
  test('不正な計算ロジックで算出された請求額を異常値として検出し、詳細なエラーログと異常値レポートを生成する', () => {
    // テストデータ: 異常な計算ロジックを持つ請求額データを準備
    const testInvoiceData = {
      customer_id: 'CUST001',
      contract_id: 'CONTRACT001',
      service_type: 'service_a',
      calculated_amount: 150000, // 異常値: 本来の計算では 100000 になるべき
      base_amount: 80000,
      achievement_count: 10,
      unit_price: 2000,
      discount_rate: 0.0,
      applied_discount_amount: 0,
      expected_amount: 100000, // 正常な計算ロジック: (80000 + 10 * 2000) * (1 - 0.0) = 100000
      billing_period: '2024-01-01',
      contract_start_date: '2024-01-01',
      contract_end_date: '2024-12-31',
    };

    // 営業データ品質管理・請求自動化システムの請求額計算結果検証機能を起動
    const validation_result = validateInvoiceAmount(testInvoiceData);

    // 計算結果が正常な請求額計算ロジックで得られるべき値と異なることを確認
    expect(validation_result.is_valid).toBe(false);
    expect(validation_result.calculated_amount).toBe(150000);
    expect(validation_result.expected_amount).toBe(100000);
    expect(validation_result.amount_difference).toBe(50000);

    // 検証機能が異常値として該当データをフラグ付けすることを確認
    expect(validation_result.has_error).toBe(true);
    expect(validation_result.error_category).toBe('calculation_logic_error');

    // エラーログに不正な計算ロジックの詳細情報が記録されていることを確認
    expect(validation_result.error_details).toContain('異常な計算ロジック');
    expect(validation_result.error_details).toContain('150000');
    expect(validation_result.error_details).toContain('100000');

    // 検証結果レポートに異常値として表示されることを確認
    expect(validation_result.report.anomaly_flags).toEqual([
      {
        field: 'calculated_amount',
        severity: 'high',
        message: '請求額の計算結果に異常が検出されました',
        detected_value: 150000,
        expected_value: 100000,
        variance_percentage: 50.0,
      },
    ]);

    // システムは該当する請求データを請求処理から除外することを確認
    expect(validation_result.exclude_from_billing).toBe(true);

    // ユーザーに対して異常値の内容と原因が明確に通知されることを確認
    expect(validation_result.notification_message).toMatch(/計算ロジック/);
    expect(validation_result.notification_message).toMatch(/異常値/);
  });
});