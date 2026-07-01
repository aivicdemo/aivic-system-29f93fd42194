import { validateSalesDataQuality } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質チェック・異常値検出・通知', () => {
  test('SCEN-1274: データ型不整合が検出され、エラー詳細と修正指示を含む通知が代表に送信される', () => {
    const input_sales_data = {
      record_id: '001',
      customer_id: 'CUST-2024-001',
      contact_date: '2024-01-15',
      appointment_count: 'five', // 期待型: number、実際の型: string (データ型不整合)
      contract_count: 3,
      service_type: 'standard',
      amount: 150000,
      status: 'completed',
    };

    const result = validateSalesDataQuality(input_sales_data);

    // 異常値検出の確認
    expect(result.validation_status).toBe('error');
    expect(result.has_errors).toBe(true);

    // エラーの詳細情報を確認
    expect(result.errors).toBeDefined();
    expect(result.errors.length).toBeGreaterThan(0);

    const type_mismatch_error = result.errors.find(
      (err: any) => err.field_name === 'appointment_count' && err.error_type === 'type_mismatch'
    );

    expect(type_mismatch_error).toBeDefined();
    expect(type_mismatch_error.expected_type).toBe('number');
    expect(type_mismatch_error.actual_type).toBe('string');
    expect(type_mismatch_error.actual_value).toBe('five');

    // 通知送信機能がトリガーされたことを確認
    expect(result.notification_triggered).toBe(true);
    expect(result.notification_type).toBe('error_detected');

    // 通知内容の確認
    expect(result.notification).toBeDefined();
    expect(result.notification.recipient_type).toBe('manager');
    expect(result.notification.recipient_email).toBeDefined();

    // 通知に修正指示が含まれることを確認
    expect(result.notification.correction_instruction).toBeDefined();
    expect(result.notification.correction_instruction).toContain('appointment_count');
    expect(result.notification.correction_instruction).toContain('数値型');

    // 通知に検出されたエラーの詳細情報が含まれることを確認
    expect(result.notification.error_details).toBeDefined();
    expect(result.notification.error_details.length).toBe(1);
    expect(result.notification.error_details[0].field_name).toBe('appointment_count');
    expect(result.notification.error_details[0].error_type).toBe('type_mismatch');
    expect(result.notification.error_details[0].message).toMatch(/データ型/);

    // データ処理ステータスの確認（該当レコードはスキップまたは警告状態で保持）
    expect(result.record_status).toBe('warning');
    expect(result.processing_action).toBe('skip_until_corrected');

    // システムログに記録されたことを確認
    expect(result.system_log).toBeDefined();
    expect(result.system_log.error_detected_timestamp).toBeDefined();
    expect(result.system_log.notification_sent_timestamp).toBeDefined();
    expect(result.system_log.record_id).toBe('001');
    expect(result.system_log.validation_failure_reason).toMatch(/appointment_count/);
  });
});