import { approveInvoiceInformation } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1296
  test('[normal] 請求情報の最終承認判定機能 - 請求情報が全ての承認基準を満たす場合に、承認ステータスが『承認済み』に更新される', () => {
    const invoice_info = {
      invoice_id: 'INV-2024-001',
      customer_id: 'CUST-0001',
      service_id: 'SVC-A01',
      billing_period_start: '2024-01-01',
      billing_period_end: '2024-01-31',
      base_amount: 100000,
      discount_rate: 0.1,
      discounted_amount: 90000,
      tax_rate: 0.1,
      tax_amount: 9000,
      total_amount: 99000,
      status: 'pending_approval'
    };

    const customer_info = {
      customer_id: 'CUST-0001',
      customer_name: 'Test Company',
      contract_status: 'active',
      billing_email: 'billing@testcompany.com'
    };

    const validation_result = {
      all_required_fields_present: true,
      amount_within_valid_range: true,
      customer_registration_valid: true,
      billing_period_valid: true,
      tax_calculation_correct: true
    };

    const result = approveInvoiceInformation({
      invoice_info,
      customer_info,
      validation_result
    });

    expect(result.approval_status).toBe('承認済み');
    expect(result.updated_at).toBeDefined();
    expect(typeof result.updated_at).toBe('string');
    expect(result.is_approved).toBe(true);
  });
});