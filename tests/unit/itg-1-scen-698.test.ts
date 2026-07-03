import { describe, test, expect } from '@jest/globals';
import { validateSalesData } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  test('SCEN-698: 月次営業データが必須項目・データ型・値の範囲をすべて満たす場合に異常が検出されない', () => {
    const salesData = {
      sales_data_id: 'SD20240115001',
      customer_id: 'CUST001',
      service_id: 'SVC001',
      appointment_count: 5,
      contract_count: 2,
      customer_response: 'positive',
      sales_amount: 150000,
      sales_date: new Date('2024-01-15T09:00:00Z'),
      sales_rep_id: 'REP001',
      status: 'completed'
    };

    const validationResult = validateSalesData(salesData);

    expect(validationResult.is_valid).toBe(true);
    expect(validationResult.errors).toEqual([]);
    expect(validationResult.required_fields_check).toBe('success');
    expect(validationResult.data_type_check).toBe('success');
    expect(validationResult.range_check).toBe('success');
    expect(validationResult.abnormality_detected).toBe(false);
    expect(validationResult.validation_status).toBe('normal');
  });
});