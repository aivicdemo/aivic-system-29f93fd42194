import { validateSalesDataWithMultipleErrors } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-1308: [edge] 処理エラーハンドリング・通知機能 - 複数の検証エラーが同時に発生した場合、全エラー内容が正確に記録・集約された状態で通知される
  test('複数の検証エラーが同時に発生した場合、全エラーが漏れなく記録・集約・通知される', () => {
    // テストデータ: 複数の検証エラーを含むレコード
    const testSalesData = {
      sales_data_id: 'SD-2024-001',
      customer_id: '', // エラー1: 必須項目の未入力
      contact_date: '2024-13-45', // エラー2: データ形式の不正（不正な日付）
      amount: -5000, // エラー3: 金額の負の値
      service_type: 'SERVICE_A',
      appointment_status: 'confirmed',
      notes: 'test',
    };

    // 複数エラーをトリガーし、検証実行
    const result = validateSalesDataWithMultipleErrors(testSalesData);

    // 期待値1: 全エラーが漏れなくエラーログに記録される
    expect(result.errors.length).toBe(3);

    // 期待値2: エラーが適切に分類・集約される
    expect(result.errors[0]).toEqual({
      error_code: 'REQUIRED_FIELD_MISSING',
      field_name: 'customer_id',
      error_message: '顧客ID',
      error_category: 'validation',
      record_id: 'SD-2024-001',
      detected_at: expect.any(String), // ISO形式のタイムスタンプ
      severity: 'error',
    });

    expect(result.errors[1]).toEqual({
      error_code: 'INVALID_FORMAT',
      field_name: 'contact_date',
      error_message: '接触日時',
      error_category: 'format',
      record_id: 'SD-2024-001',
      detected_at: expect.any(String),
      severity: 'error',
    });

    expect(result.errors[2]).toEqual({
      error_code: 'INVALID_VALUE_RANGE',
      field_name: 'amount',
      error_message: '金額',
      error_category: 'range',
      record_id: 'SD-2024-001',
      detected_at: expect.any(String),
      severity: 'error',
    });

    // 期待値3: 通知にはすべてのエラー内容が正確に含まれる
    expect(result.notification.error_count).toBe(3);
    expect(result.notification.error_categories).toEqual(
      expect.arrayContaining(['validation', 'format', 'range'])
    );
    expect(result.notification.error_summary).toContain('顧客ID');
    expect(result.notification.error_summary).toContain('接触日時');
    expect(result.notification.error_summary).toContain('金額');

    // 期待値4: 通知の形式・タイミング・送信先が仕様通りである
    expect(result.notification.format).toBe('structured');
    expect(result.notification.delivery_targets).toContain('email');
    expect(result.notification.delivery_targets).toContain('system_log');
    expect(result.notification.timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // 期待値5: エラーレコードの重複がなく、整合性が保たれている
    const error_ids = result.errors.map((err) => err.error_code + '_' + err.field_name);
    const unique_error_ids = new Set(error_ids);
    expect(unique_error_ids.size).toBe(error_ids.length);

    // 全体の検証ステータス
    expect(result.validation_status).toBe('failed');
    expect(result.is_processable).toBe(false);
  });
});