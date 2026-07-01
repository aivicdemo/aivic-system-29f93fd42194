import { generateSalesPerformanceReport } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  // SCEN-1307
  test('請求承認が得られていない営業データを含む場合、レポート生成対象外として除外される', () => {
    const approved_sales_data_1 = {
      sales_id: 'SALES_001',
      customer_id: 'CUST_A',
      service_type: 'SERVICE_X',
      appointment_count: 5,
      contract_count: 2,
      customer_feedback: 'positive',
      amount: 100000,
      billing_approval_status: 'approved',
      approval_date: '2024-01-10T09:00:00Z',
    };

    const approved_sales_data_2 = {
      sales_id: 'SALES_002',
      customer_id: 'CUST_B',
      service_type: 'SERVICE_Y',
      appointment_count: 3,
      contract_count: 1,
      customer_feedback: 'neutral',
      amount: 50000,
      billing_approval_status: 'approved',
      approval_date: '2024-01-11T10:30:00Z',
    };

    const approved_sales_data_3 = {
      sales_id: 'SALES_003',
      customer_id: 'CUST_C',
      service_type: 'SERVICE_Z',
      appointment_count: 7,
      contract_count: 3,
      customer_feedback: 'positive',
      amount: 150000,
      billing_approval_status: 'approved',
      approval_date: '2024-01-12T14:15:00Z',
    };

    const unapproved_sales_data_1 = {
      sales_id: 'SALES_004',
      customer_id: 'CUST_D',
      service_type: 'SERVICE_X',
      appointment_count: 2,
      contract_count: 0,
      customer_feedback: 'negative',
      amount: 25000,
      billing_approval_status: 'pending',
      approval_date: null,
    };

    const unapproved_sales_data_2 = {
      sales_id: 'SALES_005',
      customer_id: 'CUST_E',
      service_type: 'SERVICE_W',
      appointment_count: 4,
      contract_count: 1,
      customer_feedback: 'positive',
      amount: 75000,
      billing_approval_status: 'rejected',
      approval_date: null,
    };

    const all_sales_data = [
      approved_sales_data_1,
      approved_sales_data_2,
      approved_sales_data_3,
      unapproved_sales_data_1,
      unapproved_sales_data_2,
    ];

    const input = {
      sales_data_list: all_sales_data,
      report_period_start: '2024-01-01',
      report_period_end: '2024-01-31',
      template_id: 'TEMPLATE_001',
    };

    const result = generateSalesPerformanceReport(input);

    expect(result.included_records_count).toBe(3);
    expect(result.included_sales_ids).toContain('SALES_001');
    expect(result.included_sales_ids).toContain('SALES_002');
    expect(result.included_sales_ids).toContain('SALES_003');
    expect(result.included_sales_ids).not.toContain('SALES_004');
    expect(result.included_sales_ids).not.toContain('SALES_005');

    expect(result.total_included_amount).toBe(300000);

    expect(result.excluded_records_count).toBe(2);
    expect(result.excluded_sales_ids).toContain('SALES_004');
    expect(result.excluded_sales_ids).toContain('SALES_005');

    expect(result.excluded_reasons).toEqual({
      SALES_004: 'billing_approval_status_pending',
      SALES_005: 'billing_approval_status_rejected',
    });

    expect(result.exclusion_log).toEqual([
      {
        sales_id: 'SALES_004',
        customer_id: 'CUST_D',
        exclusion_reason: 'billing_approval_status_pending',
        excluded_at: expect.any(String),
      },
      {
        sales_id: 'SALES_005',
        customer_id: 'CUST_E',
        exclusion_reason: 'billing_approval_status_rejected',
        excluded_at: expect.any(String),
      },
    ]);

    expect(result.report_status).toBe('completed');
    expect(result.report_generated_at).toBeDefined();
  });
});