import { validateSalesDataQuality } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質自動検証機能 - データ型・単位不整合検出', () => {
  // SCEN-671: [normal] 営業データ品質自動検証機能 - データ型不整合（単位の不一致含む）が検出される
  test('単価の文字列型エラーと消費税の単位不一致エラーが検出される', () => {
    const testData = [
      {
        row_number: 1,
        unit_price: '1000円',
        quantity: 5,
        unit: '個',
      },
      {
        row_number: 2,
        sales_amount: 50000,
        sales_amount_unit: '円',
        consumption_tax: '5000',
        consumption_tax_unit: '%',
      },
    ];

    const result = validateSalesDataQuality(testData);

    // 検証結果が失敗であることを確認
    expect(result.is_valid).toBe(false);

    // エラー件数が2件であることを確認
    expect(result.errors).toHaveLength(2);

    // エラー1: 単価のデータ型不整合
    const error_1 = result.errors.find(
      (e: any) => e.field_name === 'unit_price'
    );
    expect(error_1).toBeDefined();
    expect(error_1.error_type).toBe('data_type_mismatch');
    expect(error_1.row_number).toBe(1);
    expect(error_1.detected_value).toBe('1000円');
    expect(error_1.expected_type).toBe('number');
    expect(error_1.recommendation).toMatch(/数値に変換/);

    // エラー2: 消費税の単位不一致
    const error_2 = result.errors.find(
      (e: any) => e.field_name === 'consumption_tax'
    );
    expect(error_2).toBeDefined();
    expect(error_2.error_type).toBe('unit_mismatch');
    expect(error_2.row_number).toBe(2);
    expect(error_2.detected_unit).toBe('%');
    expect(error_2.expected_unit).toBe('円');
    expect(error_2.referenced_field).toBe('sales_amount_unit');
    expect(error_2.recommendation).toMatch(/単位が矛盾/);

    // 詳細情報が各エラーに含まれていることを確認
    expect(error_1).toHaveProperty('field_name');
    expect(error_1).toHaveProperty('error_type');
    expect(error_1).toHaveProperty('row_number');
    expect(error_1).toHaveProperty('recommendation');
    expect(error_2).toHaveProperty('field_name');
    expect(error_2).toHaveProperty('error_type');
    expect(error_2).toHaveProperty('row_number');
    expect(error_2).toHaveProperty('recommendation');

    // サマリー情報を確認
    expect(result.summary).toBeDefined();
    expect(result.summary.total_errors).toBe(2);
    expect(result.summary.data_type_errors).toBe(1);
    expect(result.summary.unit_mismatch_errors).toBe(1);
  });
});