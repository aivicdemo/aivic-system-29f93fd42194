import { validateSalesDataCompleteness } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性自動検証', () => {
  // SCEN-1341: [edge] 複数の不足データ・誤りがある場合、すべての異常が検出・通知される
  test('複数の不足データ・誤りを含む営業データレコードから、すべての異常を検出・通知する', () => {
    const invalidSalesData = {
      customer_name: '',
      amount: -50000,
      contact_date: '2024-13-45',
      email: 'invalid-email@',
      appointment_status: 'CONFIRMED',
      service_type: 'SERVICE_A',
      notes: 'Test data with multiple errors'
    };

    const result = validateSalesDataCompleteness(invalidSalesData);

    // 検証結果の構造を確認
    expect(result).toEqual(
      expect.objectContaining({
        is_valid: false,
        detected_errors: expect.any(Array),
        notification_messages: expect.any(Array),
        audit_log_entries: expect.any(Array)
      })
    );

    // すべての異常が検出されたことを確認
    expect(result.detected_errors.length).toBe(4);

    // 各異常の内容確認
    const error_types = result.detected_errors.map(
      (err: { error_type: string; field_name: string }) => err.error_type
    );
    expect(error_types).toContain('MISSING_REQUIRED_FIELD');
    expect(error_types).toContain('INVALID_VALUE');
    expect(error_types).toContain('FORMAT_ERROR');
    expect(error_types).toContain('INVALID_FORMAT');

    // 検出された具体的なフィールドを確認
    const field_names = result.detected_errors.map(
      (err: { field_name: string }) => err.field_name
    );
    expect(field_names).toContain('customer_name');
    expect(field_names).toContain('amount');
    expect(field_names).toContain('contact_date');
    expect(field_names).toContain('email');

    // 各異常に対応する通知メッセージが生成されたことを確認
    expect(result.notification_messages.length).toBe(4);
    result.notification_messages.forEach(
      (msg: { field: string; message: string; severity: string }) => {
        expect(msg).toHaveProperty('field');
        expect(msg).toHaveProperty('message');
        expect(msg).toHaveProperty('severity');
        expect(['ERROR', 'WARNING']).toContain(msg.severity);
      }
    );

    // 顧客名空欄に関する通知メッセージを確認
    const customer_name_message = result.notification_messages.find(
      (msg: { field: string }) => msg.field === 'customer_name'
    );
    expect(customer_name_message).toBeDefined();
    expect(customer_name_message.message).toMatch(/顧客名/);
    expect(customer_name_message.severity).toBe('ERROR');

    // 金額負値に関する通知メッセージを確認
    const amount_message = result.notification_messages.find(
      (msg: { field: string }) => msg.field === 'amount'
    );
    expect(amount_message).toBeDefined();
    expect(amount_message.message).toMatch(/金額/);
    expect(amount_message.severity).toBe('ERROR');

    // 日付形式不正に関する通知メッセージを確認
    const date_message = result.notification_messages.find(
      (msg: { field: string }) => msg.field === 'contact_date'
    );
    expect(date_message).toBeDefined();
    expect(date_message.message).toMatch(/日付/);
    expect(date_message.severity).toBe('ERROR');

    // メールアドレス無効に関する通知メッセージを確認
    const email_message = result.notification_messages.find(
      (msg: { field: string }) => msg.field === 'email'
    );
    expect(email_message).toBeDefined();
    expect(email_message.message).toMatch(/メール/);
    expect(email_message.severity).toBe('ERROR');

    // 異常検出ログに全ての異常が記録されたことを確認
    expect(result.audit_log_entries.length).toBe(4);
    result.audit_log_entries.forEach(
      (log_entry: {
        timestamp: string;
        error_type: string;
        field_name: string;
        field_value: unknown;
        expected_format: string;
      }) => {
        expect(log_entry).toHaveProperty('timestamp');
        expect(log_entry).toHaveProperty('error_type');
        expect(log_entry).toHaveProperty('field_name');
        expect(log_entry).toHaveProperty('field_value');
        expect(log_entry).toHaveProperty('expected_format');
        expect(log_entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
      }
    );

    // ログエントリに各フィールドの情報が記録されていることを確認
    const logged_fields = result.audit_log_entries.map(
      (log_entry: { field_name: string }) => log_entry.field_name
    );
    expect(logged_fields).toContain('customer_name');
    expect(logged_fields).toContain('amount');
    expect(logged_fields).toContain('contact_date');
    expect(logged_fields).toContain('email');

    // 顧客名のログエントリ確認
    const customer_name_log = result.audit_log_entries.find(
      (log_entry: { field_name: string }) => log_entry.field_name === 'customer_name'
    );
    expect(customer_name_log).toBeDefined();
    expect(customer_name_log.error_type).toBe('MISSING_REQUIRED_FIELD');
    expect(customer_name_log.field_value).toBe('');
    expect(customer_name_log.expected_format).toMatch(/非空文字列/);

    // 金額のログエントリ確認
    const amount_log = result.audit_log_entries.find(
      (log_entry: { field_name: string }) => log_entry.field_name === 'amount'
    );
    expect(amount_log).toBeDefined();
    expect(amount_log.error_type).toBe('INVALID_VALUE');
    expect(amount_log.field_value).toBe(-50000);
    expect(amount_log.expected_format).toMatch(/正の整数/);

    // 日付のログエントリ確認
    const date_log = result.audit_log_entries.find(
      (log_entry: { field_name: string }) => log_entry.field_name === 'contact_date'
    );
    expect(date_log).toBeDefined();
    expect(date_log.error_type).toBe('FORMAT_ERROR');
    expect(date_log.field_value).toBe('2024-13-45');
    expect(date_log.expected_format).toMatch(/YYYY-MM-DD/);

    // メールアドレスのログエントリ確認
    const email_log = result.audit_log_entries.find(
      (log_entry: { field_name: string }) => log_entry.field_name === 'email'
    );
    expect(email_log).toBeDefined();
    expect(email_log.error_type).toBe('INVALID_FORMAT');
    expect(email_log.field_value).toBe('invalid-email@');
    expect(email_log.expected_format).toMatch(/メールアドレス/);
  });
});