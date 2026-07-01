import { validateBillingApprovalCriteria } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1298: [error] 請求情報の最終承認判定機能 - 承認基準の判定ロジックに矛盾がある場合に、エラーとして検出される
  test('承認基準に矛盾が存在する場合、エラーメッセージと詳細ログを返す', () => {
    // 承認金額の下限と上限が逆転している矛盾した条件
    const contradictory_criteria_inverted_limits = {
      approval_id: 'APP-001',
      customer_id: 'CUST-2024-001',
      service_id: 'SVC-SALES',
      amount_lower_limit: 150000,
      amount_upper_limit: 100000, // 下限 > 上限 → 矛盾
      discount_threshold: 50000,
      approval_status: 'PENDING',
    };

    expect(() =>
      validateBillingApprovalCriteria(contradictory_criteria_inverted_limits)
    ).toThrow(/金額範囲/);
  });

  test('相互排他的な条件が同時に有効に設定されている場合、矛盾を検出してエラーを返す', () => {
    // 「割引適用」と「割引非適用」が同時に有効という矛盾
    const contradictory_criteria_mutually_exclusive = {
      approval_id: 'APP-002',
      customer_id: 'CUST-2024-002',
      service_id: 'SVC-CONSULT',
      is_discount_applied: true,
      is_discount_not_applied: true, // 相互排他的矛盾
      minimum_quantity: 5,
      approval_status: 'PENDING',
    };

    expect(() =>
      validateBillingApprovalCriteria(contradictory_criteria_mutually_exclusive)
    ).toThrow(/相互排他/);
  });

  test('承認基準が正常に設定されている場合、検証に成功し承認可能なオブジェクトを返す', () => {
    const valid_criteria = {
      approval_id: 'APP-003',
      customer_id: 'CUST-2024-003',
      service_id: 'SVC-STANDARD',
      amount_lower_limit: 50000,
      amount_upper_limit: 500000,
      discount_threshold: 100000,
      minimum_quantity: 1,
      approval_status: 'APPROVED',
    };

    const result = validateBillingApprovalCriteria(valid_criteria);

    expect(result).toEqual({
      approval_id: 'APP-003',
      customer_id: 'CUST-2024-003',
      service_id: 'SVC-STANDARD',
      amount_lower_limit: 50000,
      amount_upper_limit: 500000,
      discount_threshold: 100000,
      minimum_quantity: 1,
      approval_status: 'APPROVED',
      validation_result: 'PASSED',
      error_details: null,
    });
  });

  test('下限値が負数である場合、無効な金額範囲として矛盾を検出', () => {
    const invalid_criteria_negative_limit = {
      approval_id: 'APP-004',
      customer_id: 'CUST-2024-004',
      service_id: 'SVC-PREMIUM',
      amount_lower_limit: -10000, // 負数 → 矛盾
      amount_upper_limit: 500000,
      approval_status: 'PENDING',
    };

    expect(() =>
      validateBillingApprovalCriteria(invalid_criteria_negative_limit)
    ).toThrow(/金額範囲/);
  });

  test('上限値が下限値と等しい場合は正常と判定し、検証に成功する', () => {
    const valid_criteria_equal_limits = {
      approval_id: 'APP-005',
      customer_id: 'CUST-2024-005',
      service_id: 'SVC-FIXED',
      amount_lower_limit: 100000,
      amount_upper_limit: 100000, // 下限 = 上限 → 固定金額として正常
      approval_status: 'APPROVED',
    };

    const result = validateBillingApprovalCriteria(valid_criteria_equal_limits);

    expect(result.validation_result).toBe('PASSED');
    expect(result.error_details).toBeNull();
  });

  test('複数の矛盾条件が同時に存在する場合、最初に検出された矛盾を優先してエラー返却', () => {
    const multiple_contradictions = {
      approval_id: 'APP-006',
      customer_id: 'CUST-2024-006',
      service_id: 'SVC-MULTI',
      amount_lower_limit: 200000,
      amount_upper_limit: 100000, // 矛盾 1: 下限 > 上限
      is_discount_applied: true,
      is_discount_not_applied: true, // 矛盾 2: 相互排他
      approval_status: 'PENDING',
    };

    expect(() =>
      validateBillingApprovalCriteria(multiple_contradictions)
    ).toThrow(/金額範囲/);
  });
});