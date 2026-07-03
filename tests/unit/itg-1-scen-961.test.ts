import { calculateAndValidateBillingAmount } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-961: [edge] 計算結果の手順書照合・検証 - 請求額が0円の場合も承認可能な正当な計算結果と判定できる
  test('請求額が0円となる正当なシナリオ（割引率100%）で計算が実行され、承認プロセスが正常に完了し、監査ログに記録される', () => {
    const input = {
      customer_id: 'CUST-001',
      service_id: 'SVC-A01',
      base_amount: 50000,
      discount_rate: 1.0,
      service_delivered: true,
      contract_id: 'CNT-2024-001',
      billing_period_start: '2024-01-01',
      billing_period_end: '2024-01-31',
      approval_user_id: 'USER-ADMIN-001',
      approval_timestamp: '2024-02-01T10:00:00Z',
    };

    const result = calculateAndValidateBillingAmount(input);

    expect(result).toEqual({
      customer_id: 'CUST-001',
      service_id: 'SVC-A01',
      calculated_billing_amount: 0,
      calculation_formula: 'base_amount * (1 - discount_rate)',
      calculation_details: {
        base_amount: 50000,
        discount_rate: 1.0,
        discount_amount: 50000,
        net_amount: 0,
      },
      is_valid_calculation: true,
      validation_status: 'pass',
      is_approved: true,
      approval_status: 'approved',
      approval_user_id: 'USER-ADMIN-001',
      approval_timestamp: '2024-02-01T10:00:00Z',
      audit_log_entry: {
        action: 'billing_amount_calculated_and_approved',
        billing_amount: 0,
        customer_id: 'CUST-001',
        service_id: 'SVC-A01',
        contract_id: 'CNT-2024-001',
        approved_by: 'USER-ADMIN-001',
        timestamp: '2024-02-01T10:00:00Z',
        reason: 'Full discount applied - calculation valid and approved',
      },
      error: null,
    });

    expect(result.calculated_billing_amount).toBe(0);
    expect(result.is_valid_calculation).toBe(true);
    expect(result.is_approved).toBe(true);
    expect(result.approval_status).toBe('approved');
    expect(result.audit_log_entry).toBeDefined();
    expect(result.audit_log_entry.billing_amount).toBe(0);
  });

  test('請求額が0円となる正当なシナリオ（サービス提供なし）で計算が実行され、承認プロセスが正常に完了し、監査ログに記録される', () => {
    const input = {
      customer_id: 'CUST-002',
      service_id: 'SVC-B02',
      base_amount: 100000,
      discount_rate: 0.0,
      service_delivered: false,
      contract_id: 'CNT-2024-002',
      billing_period_start: '2024-01-01',
      billing_period_end: '2024-01-31',
      approval_user_id: 'USER-ADMIN-002',
      approval_timestamp: '2024-02-01T11:30:00Z',
    };

    const result = calculateAndValidateBillingAmount(input);

    expect(result).toEqual({
      customer_id: 'CUST-002',
      service_id: 'SVC-B02',
      calculated_billing_amount: 0,
      calculation_formula: 'service_delivered ? base_amount * (1 - discount_rate) : 0',
      calculation_details: {
        base_amount: 100000,
        discount_rate: 0.0,
        service_delivered: false,
        net_amount: 0,
      },
      is_valid_calculation: true,
      validation_status: 'pass',
      is_approved: true,
      approval_status: 'approved',
      approval_user_id: 'USER-ADMIN-002',
      approval_timestamp: '2024-02-01T11:30:00Z',
      audit_log_entry: {
        action: 'billing_amount_calculated_and_approved',
        billing_amount: 0,
        customer_id: 'CUST-002',
        service_id: 'SVC-B02',
        contract_id: 'CNT-2024-002',
        approved_by: 'USER-ADMIN-002',
        timestamp: '2024-02-01T11:30:00Z',
        reason: 'Service not delivered - zero billing is valid',
      },
      error: null,
    });

    expect(result.calculated_billing_amount).toBe(0);
    expect(result.is_valid_calculation).toBe(true);
    expect(result.is_approved).toBe(true);
    expect(result.approval_status).toBe('approved');
    expect(result.audit_log_entry.reason).toMatch(/Service not delivered/);
  });

  test('請求額が0円の計算結果で手順書照合が実行され、正当な計算であると判定された場合、エラーが発生しない', () => {
    const input = {
      customer_id: 'CUST-003',
      service_id: 'SVC-C03',
      base_amount: 0,
      discount_rate: 0.0,
      service_delivered: true,
      contract_id: 'CNT-2024-003',
      billing_period_start: '2024-01-01',
      billing_period_end: '2024-01-31',
      approval_user_id: 'USER-ADMIN-003',
      approval_timestamp: '2024-02-01T12:00:00Z',
    };

    const result = calculateAndValidateBillingAmount(input);

    expect(result.error).toBeNull();
    expect(result.is_valid_calculation).toBe(true);
    expect(result.validation_status).toBe('pass');
    expect(result.calculated_billing_amount).toBe(0);
  });

  test('請求額が0円で承認済みの状態で、監査ログに「承認済み」ステータスが正確に記録される', () => {
    const input = {
      customer_id: 'CUST-004',
      service_id: 'SVC-D04',
      base_amount: 75000,
      discount_rate: 1.0,
      service_delivered: true,
      contract_id: 'CNT-2024-004',
      billing_period_start: '2024-01-15',
      billing_period_end: '2024-01-31',
      approval_user_id: 'USER-MANAGER-001',
      approval_timestamp: '2024-02-02T09:00:00Z',
    };

    const result = calculateAndValidateBillingAmount(input);

    expect(result.approval_status).toBe('approved');
    expect(result.audit_log_entry).toBeDefined();
    expect(result.audit_log_entry.action).toBe('billing_amount_calculated_and_approved');
    expect(result.audit_log_entry.billing_amount).toBe(0);
    expect(result.audit_log_entry.approved_by).toBe('USER-MANAGER-001');
    expect(result.audit_log_entry.timestamp).toBe('2024-02-02T09:00:00Z');
  });

  test('複数の顧客・サービス組み合わせで請求額が0円となる場合、各々が独立して承認され、監査ログに個別に記録される', () => {
    const inputs = [
      {
        customer_id: 'CUST-005',
        service_id: 'SVC-E05',
        base_amount: 30000,
        discount_rate: 1.0,
        service_delivered: true,
        contract_id: 'CNT-2024-005',
        billing_period_start: '2024-01-01',
        billing_period_end: '2024-01-31',
        approval_user_id: 'USER-ADMIN-004',
        approval_timestamp: '2024-02-01T14:00:00Z',
      },
      {
        customer_id: 'CUST-006',
        service_id: 'SVC-F06',
        base_amount: 45000,
        discount_rate: 1.0,
        service_delivered: true,
        contract_id: 'CNT-2024-006',
        billing_period_start: '2024-01-01',
        billing_period_end: '2024-01-31',
        approval_user_id: 'USER-ADMIN-005',
        approval_timestamp: '2024-02-01T14:15:00Z',
      },
    ];

    const results = inputs.map(input => calculateAndValidateBillingAmount(input));

    expect(results).toHaveLength(2);
    results.forEach((result, index) => {
      expect(result.calculated_billing_amount).toBe(0);
      expect(result.is_valid_calculation).toBe(true);
      expect(result.approval_status).toBe('approved');
      expect(result.audit_log_entry.billing_amount).toBe(0);
      expect(result.audit_log_entry.customer_id).toBe(inputs[index].customer_id);
      expect(result.audit_log_entry.service_id).toBe(inputs[index].service_id);
    });

    expect(results[0].audit_log_entry.approved_by).toBe('USER-ADMIN-004');
    expect(results[1].audit_log_entry.approved_by).toBe('USER-ADMIN-005');
  });
});