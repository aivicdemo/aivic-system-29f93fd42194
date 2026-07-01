import { validateSalesData } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質管理・請求自動化システム - 月次営業データ集計検証機能', () => {
  // SCEN-1129: [normal] 月次営業データ集計検証機能 - 複数のデータ型エラーと金額妥当性エラーが同時に存在する場合、すべてのエラーが検出される
  test('複数のデータ型エラーと金額妥当性エラーが同時に検出される', () => {
    const test_sales_data = [
      {
        record_id: 'REC-001',
        customer_id: 'CUST-A001',
        service_id: 'SVC-001',
        appointment_count: 'invalid_string',
        contract_amount: -5000,
        transaction_date: '2024-13-45',
        sales_person_name: '営業太郎',
        status: 'completed'
      },
      {
        record_id: 'REC-002',
        customer_id: 'CUST-B002',
        service_id: 'SVC-002',
        appointment_count: 3,
        contract_amount: 9999999999,
        transaction_date: '2024-02-29',
        sales_person_name: '営業花子',
        status: 'pending'
      },
      {
        record_id: 'REC-003',
        customer_id: 'CUST-C003',
        service_id: 'SVC-003',
        appointment_count: 2.5,
        contract_amount: 'abc',
        transaction_date: '2024-01-15T10:30:00Z',
        sales_person_name: '営業次郎',
        status: 'completed'
      }
    ];

    const validation_rules = {
      appointment_count: {
        data_type: 'integer',
        required: true,
        min_value: 0,
        max_value: 1000
      },
      contract_amount: {
        data_type: 'number',
        required: true,
        min_value: 0,
        max_value: 5000000
      },
      transaction_date: {
        data_type: 'date',
        required: true,
        format: 'YYYY-MM-DD'
      },
      sales_person_name: {
        data_type: 'string',
        required: true,
        max_length: 50
      }
    };

    const result = validateSalesData(test_sales_data, validation_rules);

    // エラーが検出されたことを確認
    expect(result.is_valid).toBe(false);

    // エラー総数を確認
    expect(result.error_list.length).toBe(6);

    // データ型エラーの確認
    const data_type_errors = result.error_list.filter(
      (err: any) => err.error_category === 'data_type_mismatch'
    );
    expect(data_type_errors.length).toBe(3);

    // 金額妥当性エラーの確認
    const amount_validation_errors = result.error_list.filter(
      (err: any) => err.error_category === 'amount_validation'
    );
    expect(amount_validation_errors.length).toBe(3);

    // 日付フォーマットエラーを確認
    const date_format_error = result.error_list.find(
      (err: any) => err.record_id === 'REC-002' && err.field_name === 'transaction_date'
    );
    expect(date_format_error).toBeDefined();
    expect(date_format_error?.error_message).toMatch(/日付フォーマット/);

    // appointment_count のデータ型エラーを確認
    const appointment_type_error = result.error_list.find(
      (err: any) => err.record_id === 'REC-001' && err.field_name === 'appointment_count'
    );
    expect(appointment_type_error).toBeDefined();
    expect(appointment_type_error?.error_message).toMatch(/整数型/);

    // contract_amount の負数エラーを確認
    const negative_amount_error = result.error_list.find(
      (err: any) => err.record_id === 'REC-001' && err.field_name === 'contract_amount'
    );
    expect(negative_amount_error).toBeDefined();
    expect(negative_amount_error?.error_message).toMatch(/負の金額/);

    // contract_amount の上限超過エラーを確認
    const exceeded_amount_error = result.error_list.find(
      (err: any) => err.record_id === 'REC-002' && err.field_name === 'contract_amount'
    );
    expect(exceeded_amount_error).toBeDefined();
    expect(exceeded_amount_error?.error_message).toMatch(/上限超過/);

    // contract_amount の文字列型エラーを確認
    const amount_type_error = result.error_list.find(
      (err: any) => err.record_id === 'REC-003' && err.field_name === 'contract_amount'
    );
    expect(amount_type_error).toBeDefined();
    expect(amount_type_error?.error_message).toMatch(/数値型/);

    // appointment_count の小数型エラーを確認
    const float_error = result.error_list.find(
      (err: any) => err.record_id === 'REC-003' && err.field_name === 'appointment_count'
    );
    expect(float_error).toBeDefined();
    expect(float_error?.error_message).toMatch(/整数値/);

    // エラー詳細情報の構造確認
    result.error_list.forEach((error: any) => {
      expect(error).toHaveProperty('record_id');
      expect(error).toHaveProperty('field_name');
      expect(error).toHaveProperty('error_category');
      expect(error).toHaveProperty('error_message');
      expect(error.record_id).toMatch(/^REC-\d{3}$/);
    });

    // 検証失敗ステータスが返却されることを確認
    expect(result.validation_status).toBe('failed');
    expect(result.processed_record_count).toBe(3);
    expect(result.error_summary).toEqual({
      total_error_count: 6,
      data_type_error_count: 3,
      amount_validation_error_count: 3
    });
  });
});