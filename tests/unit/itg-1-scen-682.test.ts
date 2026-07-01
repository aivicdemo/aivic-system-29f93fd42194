import { validateSalesDataWithRules } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質検証ルール実行機能', () => {
  // SCEN-682: [error] データ型が定義値と不整合な営業データが検証エラーとして検出される
  test('金額フィールドの文字列値と日付フィールドの不正な形式が検証エラーとして検出される', () => {
    // Arrange: テスト用の営業データセットを準備
    const invalidSalesData = [
      {
        row_number: 1,
        customer_id: 'CUST001',
        amount: '金額ABC', // 数値型が期待されるが、文字列を入力
        contact_date: '2024-12-15',
        service_type: 'Standard',
      },
      {
        row_number: 2,
        customer_id: 'CUST002',
        amount: 50000,
        contact_date: '2024/13/45', // 不正な日付形式（月が13、日が45）
        service_type: 'Premium',
      },
      {
        row_number: 3,
        customer_id: 'CUST003',
        amount: 75000,
        contact_date: '2024-11-30',
        service_type: 'Basic',
      },
    ];

    const validationRules = {
      amount: {
        data_type: 'number',
        required: true,
        error_level: 'ERROR',
      },
      contact_date: {
        data_type: 'string',
        format: 'YYYY-MM-DD',
        required: true,
        error_level: 'ERROR',
      },
      customer_id: {
        data_type: 'string',
        required: true,
        error_level: 'ERROR',
      },
      service_type: {
        data_type: 'string',
        required: true,
        error_level: 'ERROR',
      },
    };

    // Act: 検証ルール実行
    const validationResult = validateSalesDataWithRules(invalidSalesData, validationRules);

    // Assert: 検証エラーが正確に検出される
    // (1) 金額フィールドのデータ型不整合エラーが検出される
    const amountErrors = validationResult.errors.filter(
      (err: any) => err.field_name === 'amount' && err.row_number === 1
    );
    expect(amountErrors.length).toBe(1);
    expect(amountErrors[0].error_message).toMatch(/amount/i);

    // (2) 日付フィールドのデータ型不整合エラーが検出される
    const dateErrors = validationResult.errors.filter(
      (err: any) => err.field_name === 'contact_date' && err.row_number === 2
    );
    expect(dateErrors.length).toBe(1);
    expect(dateErrors[0].error_message).toMatch(/contact_date|date/i);

    // (3) 各エラーに対して具体的なエラーメッセージと該当行情報が表示される
    expect(amountErrors[0]).toHaveProperty('row_number', 1);
    expect(amountErrors[0]).toHaveProperty('error_message');
    expect(amountErrors[0]).toHaveProperty('field_name');
    expect(dateErrors[0]).toHaveProperty('row_number', 2);
    expect(dateErrors[0]).toHaveProperty('error_message');
    expect(dateErrors[0]).toHaveProperty('field_name');

    // (4) エラー件数が正確にカウントされる
    expect(validationResult.errors.length).toBe(2);
    expect(validationResult.error_count).toBe(2);

    // (5) エラーレベルが'ERROR'として分類される
    expect(amountErrors[0].error_level).toBe('ERROR');
    expect(dateErrors[0].error_level).toBe('ERROR');

    // 検証結果の全体的な状態確認
    expect(validationResult.validation_status).toBe('FAILED');
    expect(validationResult.total_rows_processed).toBe(3);
    expect(validationResult.passed_rows).toBe(1);
    expect(validationResult.failed_rows).toBe(2);
  });
});