import { validateSalesActivityInput } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  test('SCEN-685: 顧客名が空文字列で送信された場合に修正指示が表示される', () => {
    // 入力: 顧客名は空文字列、その他必須フィールドは有効な値
    const invalidInput = {
      customer_name: '',
      product_name: '営業支援ツール',
      contact_date: '2024-01-15',
      amount: 150000,
      appointment_confirmed: true,
      contact_type: 'meeting',
    };

    // 実行: バリデーション処理を呼び出す
    const result = validateSalesActivityInput(invalidInput);

    // 検証: バリデーション結果として失敗・エラーが返されることを確認
    expect(result.is_valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors.length).toBeGreaterThan(0);

    // 検証: エラーメッセージが顧客名の必須項目チェック失敗を示すことを確認
    const customer_name_error = result.errors.find(
      (error: any) => error.field === 'customer_name'
    );
    expect(customer_name_error).toBeDefined();
    expect(customer_name_error.message).toMatch(/顧客名/);
    expect(customer_name_error.error_code).toBe('REQUIRED_FIELD_MISSING');

    // 検証: 修正指示メッセージが明確に提示されていることを確認
    expect(result.correction_message).toMatch(/顧客名/);
    expect(result.can_submit).toBe(false);

    // 検証: その他の必須フィールド（product_name, amount など）は有効なため、
    // エラーにそれらのフィールドが含まれていないことを確認
    const product_name_error = result.errors.find(
      (error: any) => error.field === 'product_name'
    );
    expect(product_name_error).toBeUndefined();

    const amount_error = result.errors.find((error: any) => error.field === 'amount');
    expect(amount_error).toBeUndefined();
  });
});