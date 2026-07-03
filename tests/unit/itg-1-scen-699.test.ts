import { describe, test, expect, beforeEach } from '@jest/globals';
import { validateSalesDataAmount } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-699: [error] 営業データ自動検証ルール定義と異常検出機能 - 営業データの売上金額が負の値の場合に範囲外異常が検出される
  test('売上金額が負の値である場合、範囲外異常が正常に検出される', () => {
    const testSalesData = {
      sales_amount: -10000,
      customer_id: 'CUST001',
      service_type: 'basic',
      transaction_date: '2024-01-15',
    };

    const validationRule = {
      field_name: '売上金額',
      field_code: 'sales_amount',
      data_type: 'number',
      is_required: true,
      min_value: 0,
      max_value: 999999999,
      validation_type: 'range',
    };

    const result = validateSalesDataAmount(testSalesData, validationRule);

    expect(result.is_valid).toBe(false);
    expect(result.validation_status).toBe('NG');
    expect(result.error_code).toBe('OUT_OF_RANGE');
    expect(result.error_message).toMatch(/売上金額は0以上の値を入力してください/);
    expect(result.anomaly_flag).toBe(true);
    expect(result.detected_value).toBe(-10000);
    expect(result.expected_range.min).toBe(0);
    expect(result.expected_range.max).toBe(999999999);
    expect(typeof result.timestamp).toBe('string');
    expect(result.record_id).toBe('CUST001_2024-01-15');
  });

  test('売上金額が0の場合、検証が成功する', () => {
    const testSalesData = {
      sales_amount: 0,
      customer_id: 'CUST001',
      service_type: 'basic',
      transaction_date: '2024-01-15',
    };

    const validationRule = {
      field_name: '売上金額',
      field_code: 'sales_amount',
      data_type: 'number',
      is_required: true,
      min_value: 0,
      max_value: 999999999,
      validation_type: 'range',
    };

    const result = validateSalesDataAmount(testSalesData, validationRule);

    expect(result.is_valid).toBe(true);
    expect(result.validation_status).toBe('OK');
    expect(result.anomaly_flag).toBe(false);
    expect(result.detected_value).toBe(0);
  });

  test('売上金額が正の値である場合、検証が成功する', () => {
    const testSalesData = {
      sales_amount: 50000,
      customer_id: 'CUST002',
      service_type: 'premium',
      transaction_date: '2024-01-20',
    };

    const validationRule = {
      field_name: '売上金額',
      field_code: 'sales_amount',
      data_type: 'number',
      is_required: true,
      min_value: 0,
      max_value: 999999999,
      validation_type: 'range',
    };

    const result = validateSalesDataAmount(testSalesData, validationRule);

    expect(result.is_valid).toBe(true);
    expect(result.validation_status).toBe('OK');
    expect(result.anomaly_flag).toBe(false);
    expect(result.detected_value).toBe(50000);
  });

  test('売上金額が最大値を超える場合、範囲外異常が検出される', () => {
    const testSalesData = {
      sales_amount: 1000000000,
      customer_id: 'CUST003',
      service_type: 'enterprise',
      transaction_date: '2024-01-25',
    };

    const validationRule = {
      field_name: '売上金額',
      field_code: 'sales_amount',
      data_type: 'number',
      is_required: true,
      min_value: 0,
      max_value: 999999999,
      validation_type: 'range',
    };

    const result = validateSalesDataAmount(testSalesData, validationRule);

    expect(result.is_valid).toBe(false);
    expect(result.validation_status).toBe('NG');
    expect(result.error_code).toBe('OUT_OF_RANGE');
    expect(result.error_message).toMatch(/売上金額は0以上999999999以下の値を入力してください/);
    expect(result.anomaly_flag).toBe(true);
    expect(result.detected_value).toBe(1000000000);
  });

  test('売上金額がnullの場合、必須項目エラーが検出される', () => {
    const testSalesData = {
      sales_amount: null,
      customer_id: 'CUST004',
      service_type: 'basic',
      transaction_date: '2024-01-30',
    };

    const validationRule = {
      field_name: '売上金額',
      field_code: 'sales_amount',
      data_type: 'number',
      is_required: true,
      min_value: 0,
      max_value: 999999999,
      validation_type: 'range',
    };

    const result = validateSalesDataAmount(testSalesData, validationRule);

    expect(result.is_valid).toBe(false);
    expect(result.validation_status).toBe('NG');
    expect(result.error_code).toBe('REQUIRED_FIELD');
    expect(result.error_message).toMatch(/売上金額/);
    expect(result.anomaly_flag).toBe(true);
  });

  test('売上金額がnullで必須フラグがfalseの場合、検証がスキップされる', () => {
    const testSalesData = {
      sales_amount: null,
      customer_id: 'CUST005',
      service_type: 'basic',
      transaction_date: '2024-02-01',
    };

    const validationRule = {
      field_name: '売上金額',
      field_code: 'sales_amount',
      data_type: 'number',
      is_required: false,
      min_value: 0,
      max_value: 999999999,
      validation_type: 'range',
    };

    const result = validateSalesDataAmount(testSalesData, validationRule);

    expect(result.is_valid).toBe(true);
    expect(result.validation_status).toBe('OK');
    expect(result.anomaly_flag).toBe(false);
  });

  test('売上金額がdecimal型で負の値の場合、範囲外異常が検出される', () => {
    const testSalesData = {
      sales_amount: -999.99,
      customer_id: 'CUST006',
      service_type: 'basic',
      transaction_date: '2024-02-05',
    };

    const validationRule = {
      field_name: '売上金額',
      field_code: 'sales_amount',
      data_type: 'decimal',
      is_required: true,
      min_value: 0,
      max_value: 999999999,
      validation_type: 'range',
    };

    const result = validateSalesDataAmount(testSalesData, validationRule);

    expect(result.is_valid).toBe(false);
    expect(result.validation_status).toBe('NG');
    expect(result.error_code).toBe('OUT_OF_RANGE');
    expect(result.anomaly_flag).toBe(true);
    expect(result.detected_value).toBe(-999.99);
  });
});