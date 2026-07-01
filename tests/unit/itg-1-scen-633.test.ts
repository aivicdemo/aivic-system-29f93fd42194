import { validateSalesDataQuality } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質自動検証機能', () => {
  // SCEN-633: [normal] 月次営業データ品質自動検証機能 - 月次締め日到達時に全営業データの必須項目・データ型・値の範囲検証が完了し正常系結果が返される
  test('月次締め日に全営業データの必須項目・データ型・値の範囲検証が正常に完了する', () => {
    const salesDataSet = [
      {
        sales_date: '2024-01-31',
        sales_person_id: 1,
        sales_amount: 150000,
        product_code: 'PROD001',
        customer_name: '顧客A',
        contact_date: '2024-01-30T10:00:00Z',
        appointment_status: 'confirmed'
      },
      {
        sales_date: '2024-01-31',
        sales_person_id: 2,
        sales_amount: 250000,
        product_code: 'PROD002',
        customer_name: '顧客B',
        contact_date: '2024-01-29T14:30:00Z',
        appointment_status: 'confirmed'
      },
      {
        sales_date: '2024-01-31',
        sales_person_id: 3,
        sales_amount: 500000,
        product_code: 'PROD003',
        customer_name: '顧客C',
        contact_date: '2024-01-28T09:15:00Z',
        appointment_status: 'pending'
      }
    ];

    const validation_cutoff_date = '2024-01-31T23:59:59Z';

    const result = validateSalesDataQuality({
      sales_data: salesDataSet,
      cutoff_date: validation_cutoff_date,
      required_fields: [
        'sales_date',
        'sales_person_id',
        'sales_amount',
        'product_code',
        'customer_name',
        'contact_date',
        'appointment_status'
      ],
      field_type_rules: {
        sales_date: 'string',
        sales_person_id: 'number',
        sales_amount: 'number',
        product_code: 'string',
        customer_name: 'string',
        contact_date: 'string',
        appointment_status: 'string'
      },
      field_range_rules: {
        sales_person_id: { min: 1, max: 999 },
        sales_amount: { min: 0, max: 9999999 }
      }
    });

    expect(result.status).toBe('success');
    expect(result.error_message).toBe('');
    expect(result.validation_passed_count).toBe(3);
    expect(result.validation_failed_count).toBe(0);
    expect(result.has_errors).toBe(false);
    expect(result.required_fields_check_passed).toBe(true);
    expect(result.data_type_check_passed).toBe(true);
    expect(result.value_range_check_passed).toBe(true);
    expect(result.detailed_results).toEqual([
      {
        record_index: 0,
        status: 'passed',
        required_fields_valid: true,
        data_types_valid: true,
        value_ranges_valid: true,
        errors: []
      },
      {
        record_index: 1,
        status: 'passed',
        required_fields_valid: true,
        data_types_valid: true,
        value_ranges_valid: true,
        errors: []
      },
      {
        record_index: 2,
        status: 'passed',
        required_fields_valid: true,
        data_types_valid: true,
        value_ranges_valid: true,
        errors: []
      }
    ]);
    expect(result.validation_timestamp).toBe('2024-01-31T23:59:59Z');
    expect(result.total_records_processed).toBe(3);
  });
});