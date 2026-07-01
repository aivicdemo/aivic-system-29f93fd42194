import { describe, test, expect } from '@jest/globals';
import { validateContractChangeApproval } from '../../src/logic/it-1-2-1';

describe('契約変更妥当性判定機能', () => {
  // SCEN-871
  test('契約変更内容が過去データと整合し、請求額計算に誤りがない場合に承認判定が出力される', () => {
    const contractChangeInput = {
      contract_id: 'CT-2024-001',
      customer_id: 'CUST-A001',
      service_id: 'SVC-BASIC',
      change_type: 'monthly_fee_adjustment',
      previous_monthly_fee: 100000,
      new_monthly_fee: 110000,
      change_effective_date: '2024-02-01',
      contract_start_date: '2024-01-01',
      contract_end_date: '2024-12-31',
      discount_rate: 0.1,
      historical_monthly_average: 95000,
      previous_month_billed_amount: 100000,
      tax_rate: 0.1,
    };

    const expected_new_monthly_with_discount = 110000 * (1 - 0.1);
    const expected_tax = expected_new_monthly_with_discount * 0.1;
    const expected_total_billing_amount = expected_new_monthly_with_discount + expected_tax;
    const expected_month_over_month_variance =
      ((expected_total_billing_amount - 100000) / 100000) * 100;

    const result = validateContractChangeApproval(contractChangeInput);

    expect(result).toBeDefined();
    expect(result.approval_status).toBe('APPROVED');
    expect(result.calculated_monthly_fee).toBe(expected_new_monthly_with_discount);
    expect(result.calculated_tax).toBe(expected_tax);
    expect(result.total_billing_amount).toBe(expected_total_billing_amount);
    expect(result.month_over_month_variance_percent).toBeCloseTo(
      expected_month_over_month_variance,
      2
    );
    expect(result.is_within_tolerance).toBe(true);
    expect(result.variance_within_allowed_range).toBe(true);
    expect(result.approval_reason).toMatch(/過去データ/);
    expect(result.approval_reason).toMatch(/整合/);
    expect(result.historical_data_consistency).toBe(true);
    expect(result.billing_calculation_accuracy).toBe(true);
    expect(result.contains_errors).toBe(false);
    expect(typeof result.approval_timestamp).toBe('string');
    expect(result.validation_details).toBeDefined();
    expect(result.validation_details.contract_change_valid).toBe(true);
    expect(result.validation_details.financial_calculation_valid).toBe(true);
  });
});