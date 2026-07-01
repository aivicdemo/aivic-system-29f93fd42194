import { validateSalesDataQuality } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質検証 - 必須項目欠落検出', () => {
  // SCEN-964
  test('請求対象営業データから必須項目の欠落を検出できる', () => {
    // 準備: 必須項目定義
    const required_fields = [
      'customer_name',
      'billing_amount',
      'billing_date',
      'billing_address',
    ];

    // テストケース1: 顧客名欠落
    const test_data_1 = {
      customer_name: '',
      billing_amount: 100000,
      billing_date: '2024-01-15',
      billing_address: '東京都渋谷区',
    };

    const result_1 = validateSalesDataQuality(test_data_1, required_fields);

    expect(result_1.is_valid).toBe(false);
    expect(result_1.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'customer_name',
          error_type: 'missing_required_field',
        }),
      ])
    );
    expect(result_1.excluded_from_billing).toBe(true);

    // テストケース2: 請求金額欠落
    const test_data_2 = {
      customer_name: '株式会社サンプル',
      billing_amount: null,
      billing_date: '2024-01-15',
      billing_address: '東京都渋谷区',
    };

    const result_2 = validateSalesDataQuality(test_data_2, required_fields);

    expect(result_2.is_valid).toBe(false);
    expect(result_2.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'billing_amount',
          error_type: 'missing_required_field',
        }),
      ])
    );
    expect(result_2.excluded_from_billing).toBe(true);

    // テストケース3: 請求日欠落
    const test_data_3 = {
      customer_name: '株式会社サンプル',
      billing_amount: 100000,
      billing_date: '',
      billing_address: '東京都渋谷区',
    };

    const result_3 = validateSalesDataQuality(test_data_3, required_fields);

    expect(result_3.is_valid).toBe(false);
    expect(result_3.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'billing_date',
          error_type: 'missing_required_field',
        }),
      ])
    );
    expect(result_3.excluded_from_billing).toBe(true);

    // テストケース4: 請求先住所欠落
    const test_data_4 = {
      customer_name: '株式会社サンプル',
      billing_amount: 100000,
      billing_date: '2024-01-15',
      billing_address: null,
    };

    const result_4 = validateSalesDataQuality(test_data_4, required_fields);

    expect(result_4.is_valid).toBe(false);
    expect(result_4.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'billing_address',
          error_type: 'missing_required_field',
        }),
      ])
    );
    expect(result_4.excluded_from_billing).toBe(true);

    // テストケース5: 複数項目欠落
    const test_data_5 = {
      customer_name: '',
      billing_amount: null,
      billing_date: '2024-01-15',
      billing_address: '東京都渋谷区',
    };

    const result_5 = validateSalesDataQuality(test_data_5, required_fields);

    expect(result_5.is_valid).toBe(false);
    expect(result_5.errors.length).toBe(2);
    expect(result_5.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'customer_name',
          error_type: 'missing_required_field',
        }),
        expect.objectContaining({
          field: 'billing_amount',
          error_type: 'missing_required_field',
        }),
      ])
    );
    expect(result_5.excluded_from_billing).toBe(true);

    // テストケース6: すべての必須項目完備（正常系）
    const test_data_6 = {
      customer_name: '株式会社サンプル',
      billing_amount: 100000,
      billing_date: '2024-01-15',
      billing_address: '東京都渋谷区渋谷1-1-1',
    };

    const result_6 = validateSalesDataQuality(test_data_6, required_fields);

    expect(result_6.is_valid).toBe(true);
    expect(result_6.errors.length).toBe(0);
    expect(result_6.excluded_from_billing).toBe(false);

    // 検証レポート生成
    const validation_report = {
      total_records: 6,
      valid_records: 1,
      invalid_records: 5,
      excluded_from_billing: 5,
      error_details: [result_1, result_2, result_3, result_4, result_5],
    };

    expect(validation_report.total_records).toBe(6);
    expect(validation_report.valid_records).toBe(1);
    expect(validation_report.invalid_records).toBe(5);
    expect(validation_report.excluded_from_billing).toBe(5);
  });
});