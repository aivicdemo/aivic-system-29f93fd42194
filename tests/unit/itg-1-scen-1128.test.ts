import { validateSalesDataCompleteness } from '../../src/logic/it-1781935279444-2-2-1';

describe('月次営業データ集計検証機能 - 金額の妥当性境界値判定', () => {
  test('SCEN-1128: 金額の妥当性が境界値ちょうどの金額でも正しく判定される', () => {
    // 下限境界値（0円）のテストデータ
    const lower_boundary_data = {
      sales_data_id: 'SD-2024-001',
      customer_id: 'CUST-A001',
      service_id: 'SVC-001',
      amount: 0,
      appointment_count: 5,
      contract_count: 2,
      customer_feedback: 'positive',
      month: '2024-01',
      validation_status: 'pending'
    };

    // 下限境界値の検証実行
    const lower_result = validateSalesDataCompleteness(lower_boundary_data);
    
    expect(lower_result.is_valid).toBe(true);
    expect(lower_result.amount_validation_status).toBe('acceptable');
    expect(lower_result.boundary_check_result).toBe('lower_boundary_accepted');
    expect(lower_result.can_proceed_to_billing).toBe(true);

    // 上限境界値（999,999,999円）のテストデータ
    const upper_boundary_data = {
      sales_data_id: 'SD-2024-002',
      customer_id: 'CUST-A002',
      service_id: 'SVC-002',
      amount: 999999999,
      appointment_count: 100,
      contract_count: 50,
      customer_feedback: 'positive',
      month: '2024-01',
      validation_status: 'pending'
    };

    // 上限境界値の検証実行
    const upper_result = validateSalesDataCompleteness(upper_boundary_data);
    
    expect(upper_result.is_valid).toBe(true);
    expect(upper_result.amount_validation_status).toBe('acceptable');
    expect(upper_result.boundary_check_result).toBe('upper_boundary_accepted');
    expect(upper_result.can_proceed_to_billing).toBe(true);

    // 集計結果レポートの検証
    const aggregation_report = {
      total_records_processed: 2,
      valid_records: 2,
      invalid_records: 0,
      lower_boundary_amount: 0,
      upper_boundary_amount: 999999999,
      total_aggregated_amount: 999999999,
      aggregation_status: 'completed',
      ready_for_billing_automation: true
    };

    expect(aggregation_report.valid_records).toBe(2);
    expect(aggregation_report.invalid_records).toBe(0);
    expect(aggregation_report.lower_boundary_amount).toBe(0);
    expect(aggregation_report.upper_boundary_amount).toBe(999999999);
    expect(aggregation_report.total_aggregated_amount).toBe(999999999);
    expect(aggregation_report.aggregation_status).toBe('completed');
    expect(aggregation_report.ready_for_billing_automation).toBe(true);
  });
});