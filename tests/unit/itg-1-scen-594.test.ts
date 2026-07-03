import { validateSalesDataTypes } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質検証 - データ型検証', () => {
  // SCEN-594: [error] 営業データ品質検証機能 - データ型が不正な項目を検出し不合格判定される
  test('数値型・日付型・真偽値型の不正データを検出して不合格判定及び詳細エラーメッセージを返す', () => {
    const invalidSalesData = {
      sales_amount: 'ABC',
      contract_date: '2024-13-45',
      is_contracted: 1,
    };

    const result = validateSalesDataTypes(invalidSalesData);

    expect(result.status).toBe('failed');
    expect(result.validation_errors).toHaveLength(3);

    const sales_amount_error = result.validation_errors.find(
      (err) => err.field_name === 'sales_amount'
    );
    expect(sales_amount_error).toBeDefined();
    expect(sales_amount_error?.error_message).toMatch(/期待されるデータ型は/);
    expect(sales_amount_error?.error_message).toMatch(/number/);
    expect(sales_amount_error?.error_message).toMatch(/string/);

    const contract_date_error = result.validation_errors.find(
      (err) => err.field_name === 'contract_date'
    );
    expect(contract_date_error).toBeDefined();
    expect(contract_date_error?.error_message).toMatch(/期待されるデータ型は/);
    expect(contract_date_error?.error_message).toMatch(/date/);
    expect(contract_date_error?.error_message).toMatch(/YYYY-MM-DD/);

    const is_contracted_error = result.validation_errors.find(
      (err) => err.field_name === 'is_contracted'
    );
    expect(is_contracted_error).toBeDefined();
    expect(is_contracted_error?.error_message).toMatch(/期待されるデータ型は/);
    expect(is_contracted_error?.error_message).toMatch(/boolean/);
    expect(is_contracted_error?.error_message).toMatch(/number/);
  });
});