import { validateSalesDataQuality } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質検証・異常検出機能', () => {
  // SCEN-944: [error] 複数の品質検証エラーが同時発生した場合、すべてが正しく特定される
  test('複数の品質検証エラーを同時に検出し、すべてのエラーが正確に記録される', () => {
    const sales_data_record = {
      customer_name: '',
      amount: -5000,
      transaction_date: '2024-13-45',
      email_address: 'invalid-email-format',
      service_type: 'Type-A',
      transaction_id: 'TRX-001'
    };

    const validation_result = validateSalesDataQuality(sales_data_record);

    // エラー総数の検証: 4つのエラーが検出されることを確認
    expect(validation_result.error_list.length).toBe(4);

    // エラーコードの検証
    const error_codes = validation_result.error_list.map((err: any) => err.error_code);
    expect(error_codes).toContain('MISSING_CUSTOMER_NAME');
    expect(error_codes).toContain('INVALID_AMOUNT');
    expect(error_codes).toContain('INVALID_DATE_FORMAT');
    expect(error_codes).toContain('INVALID_EMAIL_FORMAT');

    // エラーメッセージの検証
    const customer_name_error = validation_result.error_list.find(
      (err: any) => err.error_code === 'MISSING_CUSTOMER_NAME'
    );
    expect(customer_name_error).toBeDefined();
    expect(customer_name_error.error_message).toMatch(/顧客名/);

    const amount_error = validation_result.error_list.find(
      (err: any) => err.error_code === 'INVALID_AMOUNT'
    );
    expect(amount_error).toBeDefined();
    expect(amount_error.error_message).toMatch(/金額/);

    const date_error = validation_result.error_list.find(
      (err: any) => err.error_code === 'INVALID_DATE_FORMAT'
    );
    expect(date_error).toBeDefined();
    expect(date_error.error_message).toMatch(/日付/);

    const email_error = validation_result.error_list.find(
      (err: any) => err.error_code === 'INVALID_EMAIL_FORMAT'
    );
    expect(email_error).toBeDefined();
    expect(email_error.error_message).toMatch(/メール/);

    // エラー発生箇所（フィールド名）の検証
    expect(customer_name_error.field_name).toBe('customer_name');
    expect(amount_error.field_name).toBe('amount');
    expect(date_error.field_name).toBe('transaction_date');
    expect(email_error.field_name).toBe('email_address');

    // エラーの重要度レベルの検証
    expect(customer_name_error.severity_level).toBe('Critical');
    expect(amount_error.severity_level).toBe('Critical');
    expect(date_error.severity_level).toBe('Warning');
    expect(email_error.severity_level).toBe('Warning');

    // 重複するエラーがないことを検証
    const unique_error_codes = new Set(error_codes);
    expect(unique_error_codes.size).toBe(4);

    // 全体的な検証結果ステータスが不合格であることを確認
    expect(validation_result.validation_status).toBe('FAILED');

    // すべてのエラーにタイムスタンプが記録されていることを確認
    validation_result.error_list.forEach((err: any) => {
      expect(err.detected_timestamp).toBeDefined();
      expect(typeof err.detected_timestamp).toBe('string');
    });
  });
});