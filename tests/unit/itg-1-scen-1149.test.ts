import { validateSalesData } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-1149: [normal] 営業データ品質検証・エラー検出機能 - 必須項目欠落時に検証失敗が正しく記録される
  test('必須項目欠落時に検証失敗とエラー内容が正しく記録される', () => {
    const now = new Date('2024-01-15T11:00:00Z');

    // テストデータ：顧客名を意図的に空白にした不完全なデータ
    const incompleteData = {
      customer_name: '',
      amount: 50000,
      contact_date: '2024-01-10',
      appointment_status: '確定',
      service_type: 'コンサル',
    };

    const result = validateSalesData(incompleteData, now);

    // ①検証ステータスが「失敗」と記録されること
    expect(result.validation_status).toBe('failed');

    // ②不足している具体的な必須項目名が特定されること
    expect(result.missing_fields).toEqual(expect.arrayContaining(['customer_name']));

    // ③エラーメッセージが明確に表示されること
    expect(result.error_message).toMatch(/顧客名/);

    // ④エラー検出のタイムスタンプが記録されること
    expect(result.error_timestamp).toBe('2024-01-15T11:00:00Z');

    // ⑤検証失敗の記録がシステムログ・監査ログに含まれること
    expect(result.audit_log).toBeDefined();
    expect(result.audit_log.error_code).toBe('MISSING_REQUIRED_FIELD');
    expect(result.audit_log.target_field).toBe('customer_name');
    expect(result.audit_log.severity).toBe('error');
    expect(result.audit_log.recorded_at).toBe('2024-01-15T11:00:00Z');
  });
});