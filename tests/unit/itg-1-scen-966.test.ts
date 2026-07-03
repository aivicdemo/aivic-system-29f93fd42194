import { validateInvoiceFromSalesData } from '../../src/logic/it-1781935279444-2-2-1';

describe('請求書自動検証機能 - 営業データから生成された請求書の不備検出', () => {
  // SCEN-966: [error] 請求書自動検証機能 - 検証済みの営業データから生成された請求書に不備が検出される
  test('SCEN-966: 必須項目欠損・形式エラー・金額誤差を検出し、エラータイプを分類して記録', () => {
    // ============================================================
    // 準備: 検証済みの営業データを作成
    // ============================================================
    const verifiedSalesData = {
      sales_data_id: 'SD-20240115-001',
      customer_id: 'CUST-001',
      customer_name: '株式会社テスト商社',
      service_type: 'コンサルティング',
      quantity: 10,
      unit_price: 100000,
      subtotal: 1000000,
      tax_rate: 0.1,
      tax_amount: 100000,
      total_amount: 1100000,
      sales_date: '2024-01-15',
      contract_id: 'CONTRACT-001',
    };

    // ============================================================
    // 生成される請求書: 意図的に複数の不備を含める
    // ============================================================
    const generatedInvoice = {
      invoice_number: '', // 必須項目欠損: 空文字列
      invoice_date: '2024/01/15', // 形式エラー: スラッシュ区切り（ISO形式ではない）
      customer_name: '株式会社テスト商社',
      customer_id: 'CUST-001',
      line_items: [
        {
          description: 'コンサルティングサービス',
          quantity: 10,
          unit_price: 100000,
          amount: 1000000,
        },
      ],
      subtotal: 1000000,
      tax_rate: 0.1,
      tax_amount: 100000,
      total_amount: 1100500, // 金額誤差: 1100000 ではなく 1100500
      currency: 'JPY',
      payment_terms: 'Net 30',
    };

    // ============================================================
    // 期待される検証結果
    // ============================================================
    const expectedValidationResult = {
      is_valid: false,
      errors: [
        {
          error_type: '必須項目欠損',
          field_name: 'invoice_number',
          detected_value: '',
          expected_value: '非空文字列（請求番号）',
          error_message: '請求番号が入力されていません',
          severity: 'error',
        },
        {
          error_type: '形式エラー',
          field_name: 'invoice_date',
          detected_value: '2024/01/15',
          expected_value: 'YYYY-MM-DD形式',
          error_message: '請求日の形式がISO 8601形式ではありません',
          severity: 'error',
        },
        {
          error_type: '金額誤差',
          field_name: 'total_amount',
          detected_value: 1100500,
          expected_value: 1100000,
          error_message:
            '合計金額が営業データから計算された金額と一致しません（差分: 500円）',
          severity: 'error',
        },
      ],
      validation_timestamp: '2024-01-15T11:00:00Z',
      validated_by: 'SYSTEM_AUTO',
    };

    // ============================================================
    // 検証関数を実行
    // ============================================================
    const result = validateInvoiceFromSalesData(
      verifiedSalesData,
      generatedInvoice
    );

    // ============================================================
    // Assertion 1: 全体の検証結果が不合格であることを確認
    // ============================================================
    expect(result.is_valid).toBe(false);

    // ============================================================
    // Assertion 2: 検出されたエラーの総数が 3 であることを確認
    // ============================================================
    expect(result.errors).toHaveLength(3);

    // ============================================================
    // Assertion 3: エラータイプ1 - 必須項目欠損の検証
    // ============================================================
    const missingFieldError = result.errors.find(
      (e) => e.error_type === '必須項目欠損'
    );
    expect(missingFieldError).toBeDefined();
    expect(missingFieldError?.field_name).toBe('invoice_number');
    expect(missingFieldError?.detected_value).toBe('');
    expect(missingFieldError?.severity).toBe('error');
    expect(missingFieldError?.error_message).toMatch(/請求番号/);

    // ============================================================
    // Assertion 4: エラータイプ2 - 形式エラーの検証
    // ============================================================
    const formatError = result.errors.find(
      (e) => e.error_type === '形式エラー'
    );
    expect(formatError).toBeDefined();
    expect(formatError?.field_name).toBe('invoice_date');
    expect(formatError?.detected_value).toBe('2024/01/15');
    expect(formatError?.severity).toBe('error');
    expect(formatError?.error_message).toMatch(/形式/);

    // ============================================================
    // Assertion 5: エラータイプ3 - 金額誤差の検証
    // ============================================================
    const amountError = result.errors.find(
      (e) => e.error_type === '金額誤差'
    );
    expect(amountError).toBeDefined();
    expect(amountError?.field_name).toBe('total_amount');
    expect(amountError?.detected_value).toBe(1100500);
    expect(amountError?.expected_value).toBe(1100000);
    expect(amountError?.severity).toBe('error');
    expect(amountError?.error_message).toMatch(/金額/);

    // ============================================================
    // Assertion 6: エラー詳細情報がすべて含まれていることを確認
    // ============================================================
    result.errors.forEach((error) => {
      expect(error).toHaveProperty('error_type');
      expect(error).toHaveProperty('field_name');
      expect(error).toHaveProperty('detected_value');
      expect(error).toHaveProperty('expected_value');
      expect(error).toHaveProperty('error_message');
      expect(error).toHaveProperty('severity');
    });

    // ============================================================
    // Assertion 7: 検証タイムスタンプが ISO 8601 形式であることを確認
    // ============================================================
    expect(result.validation_timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // ============================================================
    // Assertion 8: 検証実行者がシステム自動であることを確認
    // ============================================================
    expect(result.validated_by).toBe('SYSTEM_AUTO');

    // ============================================================
    // Assertion 9: 結果全体が期待値と構造的に一致することを確認
    // ============================================================
    expect(result).toMatchObject({
      is_valid: false,
      errors: expect.arrayContaining([
        expect.objectContaining({
          error_type: expect.stringMatching(
            /必須項目欠損|形式エラー|金額誤差/
          ),
          severity: 'error',
        }),
      ]),
    });
  });
});