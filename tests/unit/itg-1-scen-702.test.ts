import { validateSalesDataQuality } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質チェック結果表示機能', () => {
  // SCEN-702: [normal] 複数の品質不備が存在する場合にすべてのエラーを一覧表示する
  test('複数の品質不備を含む営業データをチェックすると、すべてのエラーが詳細情報付きで一覧表示される', () => {
    const input_sales_data = [
      {
        row_number: 1,
        customer_name: '',
        contact_date: '2024-13-45',
        sales_amount: -5000,
        appointment_status: 'invalid_status',
        service_type: 'Service_A',
      },
      {
        row_number: 2,
        customer_name: 'Customer B',
        contact_date: '2024-01-15',
        sales_amount: 10000,
        appointment_status: 'confirmed',
        service_type: '',
      },
      {
        row_number: 3,
        customer_name: 'Customer C',
        contact_date: '2024-01-16',
        sales_amount: null,
        appointment_status: 'pending',
        service_type: 'Service_C',
      },
    ];

    const result = validateSalesDataQuality(input_sales_data);

    expect(result).toEqual({
      is_valid: false,
      total_errors: 6,
      error_list: [
        {
          error_code: 'ERR_CUST_001',
          error_message: '顧客名が空白です',
          field_name: 'customer_name',
          row_number: 1,
          severity: 'error',
          data_value: '',
        },
        {
          error_code: 'ERR_DATE_002',
          error_message: '接触日付の形式が不正です',
          field_name: 'contact_date',
          row_number: 1,
          severity: 'error',
          data_value: '2024-13-45',
        },
        {
          error_code: 'ERR_AMT_003',
          error_message: '売上金額が負数です',
          field_name: 'sales_amount',
          row_number: 1,
          severity: 'error',
          data_value: -5000,
        },
        {
          error_code: 'ERR_STATUS_004',
          error_message: 'アポ確定状況の値が無効です',
          field_name: 'appointment_status',
          row_number: 1,
          severity: 'error',
          data_value: 'invalid_status',
        },
        {
          error_code: 'ERR_SVC_005',
          error_message: 'サービス種別が空白です',
          field_name: 'service_type',
          row_number: 2,
          severity: 'error',
          data_value: '',
        },
        {
          error_code: 'ERR_AMT_006',
          error_message: '売上金額が空欄です',
          field_name: 'sales_amount',
          row_number: 3,
          severity: 'error',
          data_value: null,
        },
      ],
      summary: {
        error_count: 6,
        warning_count: 0,
        affected_rows: 3,
        total_rows_checked: 3,
      },
      categorized_errors: {
        required_field_errors: 2,
        data_type_errors: 2,
        range_errors: 1,
        format_errors: 1,
      },
    });

    expect(result.is_valid).toBe(false);
    expect(result.total_errors).toBe(6);
    expect(result.error_list.length).toBe(6);
    expect(result.summary.error_count).toBe(6);
    expect(result.summary.affected_rows).toBe(3);

    const error_codes = result.error_list.map((e) => e.error_code);
    expect(error_codes).toContain('ERR_CUST_001');
    expect(error_codes).toContain('ERR_DATE_002');
    expect(error_codes).toContain('ERR_AMT_003');
    expect(error_codes).toContain('ERR_STATUS_004');
    expect(error_codes).toContain('ERR_SVC_005');
    expect(error_codes).toContain('ERR_AMT_006');

    const row_1_errors = result.error_list.filter((e) => e.row_number === 1);
    expect(row_1_errors.length).toBe(4);

    const all_have_details = result.error_list.every(
      (e) =>
        e.error_code &&
        e.error_message &&
        e.field_name &&
        e.row_number &&
        e.severity &&
        e.data_value !== undefined
    );
    expect(all_have_details).toBe(true);

    expect(result.categorized_errors.required_field_errors).toBe(2);
    expect(result.categorized_errors.data_type_errors).toBe(2);
    expect(result.categorized_errors.range_errors).toBe(1);
    expect(result.categorized_errors.format_errors).toBe(1);
  });
});