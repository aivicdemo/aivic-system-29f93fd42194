import { convertSalesDataFieldType } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目メタデータ管理機能', () => {
  // SCEN-665: [edge] 営業データ項目メタデータ一元管理機能 - データ型不整合（文字列が数値フィールドに入力）は変換される
  test('数値フィールドに文字列が入力された場合、自動的に数値に変換され、変換ログが記録される', () => {
    // 入力: 数値フィールド（売上金額）に文字列値が入力された状態
    const input_field_name = 'sales_amount';
    const input_field_type = 'number';
    const input_raw_value = '12345円';
    const input_timestamp = new Date('2024-01-15T09:30:00Z');
    const input_user_id = 'user_001';

    // 期待: 文字列「12345円」から数値 12345 に自動変換され、エラーなく処理される
    const result = convertSalesDataFieldType({
      field_name: input_field_name,
      field_type: input_field_type,
      raw_value: input_raw_value,
      timestamp: input_timestamp,
      user_id: input_user_id,
    });

    // 変換結果が数値 12345 であることを確認
    expect(result.converted_value).toBe(12345);
    expect(typeof result.converted_value).toBe('number');

    // 変換成功ステータスを確認
    expect(result.conversion_status).toBe('success');

    // 変換処理がログに記録されていることを確認
    expect(result.audit_log).toBeDefined();
    expect(result.audit_log.field_name).toBe('sales_amount');
    expect(result.audit_log.original_value).toBe('12345円');
    expect(result.audit_log.converted_value).toBe(12345);
    expect(result.audit_log.conversion_type).toBe('string_to_number');
    expect(result.audit_log.user_id).toBe('user_001');
    expect(result.audit_log.timestamp).toEqual(new Date('2024-01-15T09:30:00Z'));

    // 複数の単位付き文字列入力テスト: 「100個」→ 100
    const result_2 = convertSalesDataFieldType({
      field_name: 'quantity',
      field_type: 'number',
      raw_value: '100個',
      timestamp: new Date('2024-01-15T10:00:00Z'),
      user_id: 'user_002',
    });

    expect(result_2.converted_value).toBe(100);
    expect(result_2.conversion_status).toBe('success');
    expect(result_2.audit_log.field_name).toBe('quantity');
    expect(result_2.audit_log.original_value).toBe('100個');
    expect(result_2.audit_log.converted_value).toBe(100);

    // 小数を含む文字列入力テスト: 「99.99円」→ 99.99
    const result_3 = convertSalesDataFieldType({
      field_name: 'unit_price',
      field_type: 'number',
      raw_value: '99.99円',
      timestamp: new Date('2024-01-15T10:30:00Z'),
      user_id: 'user_003',
    });

    expect(result_3.converted_value).toBe(99.99);
    expect(result_3.conversion_status).toBe('success');
    expect(result_3.audit_log.converted_value).toBe(99.99);

    // 変換できない文字列入力テスト: エラーが発生
    const result_4 = convertSalesDataFieldType({
      field_name: 'sales_amount',
      field_type: 'number',
      raw_value: 'invalid_text',
      timestamp: new Date('2024-01-15T11:00:00Z'),
      user_id: 'user_004',
    });

    expect(result_4.conversion_status).toBe('error');
    expect(result_4.error_message).toMatch(/数値変換失敗/);
    expect(result_4.audit_log.conversion_type).toBe('string_to_number_failed');
  });
});