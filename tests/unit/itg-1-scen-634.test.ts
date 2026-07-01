import { validateSalesDataQuality } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-634: [error] 月次営業データ品質自動検証機能 - 営業データの必須項目が未入力の場合、検証エラーが正確に検出される
  test('必須項目未入力時に複数エラーが検出される', () => {
    const sales_data_record = {
      customer_name: '',
      transaction_amount: 0,
      transaction_date: '',
      contact_date: '2024-01-15',
      service_type: 'standard',
      sales_person: 'sales_001',
      status: 'completed',
    };

    const result = validateSalesDataQuality(sales_data_record);

    // 期待結果: 必須項目の未入力が検出され、各未入力項目ごとにエラーが返される
    expect(result.is_valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(Array.isArray(result.errors)).toBe(true);

    // 必須項目の未入力エラーを検証
    expect(result.errors.length).toBe(3); // customer_name, transaction_amount, transaction_date の3つが未入力

    const error_field_names = result.errors.map((err: any) => err.field_name);
    expect(error_field_names).toContain('customer_name');
    expect(error_field_names).toContain('transaction_amount');
    expect(error_field_names).toContain('transaction_date');

    // 各エラー情報に項目名とエラーコードが含まれていることを確認
    result.errors.forEach((err: any) => {
      expect(err).toHaveProperty('field_name');
      expect(err).toHaveProperty('error_code');
      expect(err).toHaveProperty('error_message');
      expect(typeof err.field_name).toBe('string');
      expect(typeof err.error_code).toBe('string');
      expect(typeof err.error_message).toBe('string');

      // エラーコードが正確に対応する必須項目エラーであることを確認
      if (err.field_name === 'customer_name') {
        expect(err.error_code).toMatch(/required|customer_name/i);
      } else if (err.field_name === 'transaction_amount') {
        expect(err.error_code).toMatch(/required|transaction_amount|金額/i);
      } else if (err.field_name === 'transaction_date') {
        expect(err.error_code).toMatch(/required|transaction_date|日付/i);
      }
    });

    // エラー詳細情報に行番号情報が含まれているかを確認
    result.errors.forEach((err: any) => {
      if (err.row_number !== undefined) {
        expect(typeof err.row_number).toBe('number');
      }
    });
  });

  test('すべての必須項目が入力されている場合は検証に合格する', () => {
    const sales_data_record = {
      customer_name: 'Customer A',
      transaction_amount: 50000,
      transaction_date: '2024-01-15',
      contact_date: '2024-01-15',
      service_type: 'standard',
      sales_person: 'sales_001',
      status: 'completed',
    };

    const result = validateSalesDataQuality(sales_data_record);

    expect(result.is_valid).toBe(true);
    expect(result.errors).toBeDefined();
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  test('顧客名のみ未入力の場合、そのエラーのみが検出される', () => {
    const sales_data_record = {
      customer_name: '',
      transaction_amount: 75000,
      transaction_date: '2024-01-20',
      contact_date: '2024-01-20',
      service_type: 'premium',
      sales_person: 'sales_002',
      status: 'completed',
    };

    const result = validateSalesDataQuality(sales_data_record);

    expect(result.is_valid).toBe(false);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].field_name).toBe('customer_name');
    expect(result.errors[0].error_code).toMatch(/required|customer_name/i);
  });

  test('データ型の不整合がある場合もエラーとして検出される', () => {
    const sales_data_record = {
      customer_name: 'Customer B',
      transaction_amount: 'not_a_number',
      transaction_date: '2024-01-25',
      contact_date: '2024-01-25',
      service_type: 'standard',
      sales_person: 'sales_003',
      status: 'completed',
    };

    const result = validateSalesDataQuality(sales_data_record);

    expect(result.is_valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(1);

    const amount_error = result.errors.find((err: any) => err.field_name === 'transaction_amount');
    expect(amount_error).toBeDefined();
    if (amount_error) {
      expect(amount_error.error_code).toMatch(/type|金額|数値/i);
    }
  });

  test('値の範囲外のエラーが検出される', () => {
    const sales_data_record = {
      customer_name: 'Customer C',
      transaction_amount: -10000,
      transaction_date: '2024-01-30',
      contact_date: '2024-01-30',
      service_type: 'standard',
      sales_person: 'sales_004',
      status: 'completed',
    };

    const result = validateSalesDataQuality(sales_data_record);

    expect(result.is_valid).toBe(false);

    const amount_error = result.errors.find((err: any) => err.field_name === 'transaction_amount');
    if (amount_error) {
      expect(amount_error.error_code).toMatch(/range|金額|負数/i);
    }
  });

  test('複数の必須項目が未入力で、かつデータ型エラーがある場合、すべてのエラーが検出される', () => {
    const sales_data_record = {
      customer_name: '',
      transaction_amount: 'invalid',
      transaction_date: '',
      contact_date: '2024-02-01',
      service_type: 'standard',
      sales_person: 'sales_005',
      status: 'completed',
    };

    const result = validateSalesDataQuality(sales_data_record);

    expect(result.is_valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);

    const field_names_with_errors = result.errors.map((err: any) => err.field_name);
    expect(field_names_with_errors).toContain('customer_name');
    expect(field_names_with_errors).toContain('transaction_amount');
    expect(field_names_with_errors).toContain('transaction_date');

    // 各エラーが必須フィールドを持つことを確認
    result.errors.forEach((err: any) => {
      expect(err).toHaveProperty('field_name');
      expect(err).toHaveProperty('error_code');
      expect(err).toHaveProperty('error_message');
      expect(err.field_name).toBeTruthy();
      expect(err.error_code).toBeTruthy();
      expect(err.error_message).toBeTruthy();
    });
  });
});