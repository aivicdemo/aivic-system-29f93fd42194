import { validateSalesData } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-1320: [normal] 営業データ自動検証ルール定義と異常検出 - 複数の検証ルール条件をすべて満たす営業データが正常と判定される
  test('複数の検証ルール条件をすべて満たす営業データが正常（Valid）と判定され、異常フラグが立たず、エラーメッセージが表示されないこと', () => {
    // 検証ルール条件の定義
    const validationRules = [
      {
        rule_id: 'cust_name_required',
        rule_name: '顧客名必須',
        field_name: 'customer_name',
        condition_type: 'not_empty',
        threshold_value: null,
        is_active: true,
      },
      {
        rule_id: 'amount_positive',
        rule_name: '金額が0より大きい',
        field_name: 'amount',
        condition_type: 'greater_than',
        threshold_value: '0',
        is_active: true,
      },
      {
        rule_id: 'transaction_date_past',
        rule_name: '取引日が過去日付',
        field_name: 'transaction_date',
        condition_type: 'less_than_or_equal',
        threshold_value: '2024-12-31',
        is_active: true,
      },
    ];

    // すべての検証ルール条件を満たすサンプルデータ
    const salesDataSample = {
      data_id: 'SALES-20241215-001',
      customer_name: 'ABC Corporation',
      amount: 150000,
      transaction_date: '2024-12-15',
      service_type: 'Premium',
      created_at: new Date('2024-12-15T10:00:00Z').toISOString(),
    };

    // データ検証処理を実行
    const validationResult = validateSalesData(salesDataSample, validationRules);

    // 期待結果：すべての検証ルール条件を満たすデータが正常と判定される
    expect(validationResult.is_valid).toBe(true);
    expect(validationResult.validation_status).toBe('Valid');
    expect(validationResult.has_error_flag).toBe(false);
    expect(validationResult.error_messages).toEqual([]);
    expect(validationResult.passed_rule_count).toBe(3);
    expect(validationResult.failed_rule_count).toBe(0);

    // 検証結果レポートで当該データが正常データとしてカウントされることを確認
    expect(validationResult.report.total_records_validated).toBe(1);
    expect(validationResult.report.valid_records_count).toBe(1);
    expect(validationResult.report.invalid_records_count).toBe(0);
    expect(validationResult.report.validation_completion_rate).toBe(100);
  });
});