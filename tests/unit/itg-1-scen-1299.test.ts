import { validateBillingApproval } from '../../src/logic/it-1-2-1';

describe('請求情報の最終承認判定機能', () => {
  // SCEN-1299
  test('複数の承認基準が同時に不満足となる場合に、優先度順に差戻し理由が記録される', () => {
    const billing_info = {
      billing_id: 'BILL20240115001',
      customer_id: 'CUST00001',
      service_id: 'SVC00001',
      amount: 1500000,
      billing_format_status: 'invalid',
      customer_credit_score: 30,
      max_amount_limit: 1000000,
    };

    const approval_criteria = [
      {
        criteria_id: 'CRIT001',
        criteria_name: '金額上限チェック',
        priority: 1,
        check_func: (info: typeof billing_info) => info.amount <= info.max_amount_limit,
        rejection_reason: '金額上限チェック失敗',
      },
      {
        criteria_id: 'CRIT002',
        criteria_name: '顧客信用度チェック',
        priority: 2,
        check_func: (info: typeof billing_info) => info.customer_credit_score >= 50,
        rejection_reason: '顧客信用度チェック失敗',
      },
      {
        criteria_id: 'CRIT003',
        criteria_name: '請求書フォーマットチェック',
        priority: 3,
        check_func: (info: typeof billing_info) => info.billing_format_status === 'valid',
        rejection_reason: '請求書フォーマットチェック失敗',
      },
    ];

    const result = validateBillingApproval(billing_info, approval_criteria);

    expect(result.approval_status).toBe('差戻し');
    expect(result.rejection_reasons.length).toBe(3);
    expect(result.rejection_reasons[0]).toBe('金額上限チェック失敗');
    expect(result.rejection_reasons[1]).toBe('顧客信用度チェック失敗');
    expect(result.rejection_reasons[2]).toBe('請求書フォーマットチェック失敗');
    expect(result.billing_id).toBe('BILL20240115001');
    expect(result.customer_id).toBe('CUST00001');
  });
});