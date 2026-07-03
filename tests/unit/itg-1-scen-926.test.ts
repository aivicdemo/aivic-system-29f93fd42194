import { validateSalesData } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質検証ルール適用 - 必須項目欠落検出', () => {
  // SCEN-926
  test('必須項目欠落を検出し、不合格判定が返却される', () => {
    // テストデータ: 必須項目の一部を欠落させる
    const sales_data_with_missing_required_fields = {
      customer_name: '',
      amount: 50000,
      transaction_date: '2024-01-15',
      service_type: 'appointment',
      sales_person_id: 'sp001',
      contract_id: 'ct001',
    };

    // 検証ルールの定義
    const validation_rules = {
      required_fields: ['customer_name', 'amount', 'transaction_date'],
      field_types: {
        customer_name: 'string',
        amount: 'number',
        transaction_date: 'string',
      },
      field_constraints: {
        customer_name: { min_length: 1, max_length: 255 },
        amount: { min_value: 0, max_value: 9999999 },
      },
    };

    // 検証処理を実行
    const validation_result = validateSalesData(
      sales_data_with_missing_required_fields,
      validation_rules
    );

    // 期待結果: 不合格判定で返却される
    expect(validation_result.status).toBe(422);
    expect(validation_result.is_valid).toBe(false);
    expect(validation_result.error_details).toContainEqual(
      expect.objectContaining({
        field_name: 'customer_name',
        error_type: 'required_field_missing',
      })
    );
    expect(validation_result.error_message).toMatch(/customer_name/);
  });
});