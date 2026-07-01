import { describe, test, expect, beforeEach } from '@jest/globals';
import { applyBillingRuleChange } from '../../src/logic/it-1-2-1';

describe('請求ルール変更時の遡及適用判定', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1014
  test('適用開始日が不明確または将来日の場合、ルール変更適用がスキップされエラーが返される', () => {
    // 1. 適用開始日が空白（不明確）の場合
    const ruleChangeWithEmptyStartDate = {
      billingRuleId: 'rule-001',
      customerId: 'cust-A',
      serviceId: 'svc-B',
      newDiscountRate: 0.1,
      effectiveStartDate: '',
      changeDescription: 'Discount rate update',
    };

    expect(() => applyBillingRuleChange(ruleChangeWithEmptyStartDate)).toThrow(/適用開始日/);

    // 2. 適用開始日が将来日の場合
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const ruleChangeWithFutureDate = {
      billingRuleId: 'rule-002',
      customerId: 'cust-B',
      serviceId: 'svc-C',
      newDiscountRate: 0.15,
      effectiveStartDate: futureDate.toISOString(),
      changeDescription: 'Future discount rate update',
    };

    expect(() => applyBillingRuleChange(ruleChangeWithFutureDate)).toThrow(/将来日/);

    // 3. 適用開始日が有効な過去日の場合は成功
    const validDate = new Date('2024-01-15T00:00:00Z');
    const ruleChangeWithValidDate = {
      billingRuleId: 'rule-003',
      customerId: 'cust-C',
      serviceId: 'svc-A',
      newDiscountRate: 0.2,
      effectiveStartDate: validDate.toISOString(),
      changeDescription: 'Valid discount rate update',
    };

    const result = applyBillingRuleChange(ruleChangeWithValidDate);
    expect(result).toEqual({
      success: true,
      ruleId: 'rule-003',
      customerId: 'cust-C',
      serviceId: 'svc-A',
      appliedDiscountRate: 0.2,
      effectiveStartDate: validDate.toISOString(),
      retroactivelyApplied: true,
      systemLogEntry: expect.objectContaining({
        timestamp: expect.any(String),
        action: 'billing_rule_applied',
        ruleId: 'rule-003',
        status: 'completed',
      }),
    });

    // 4. 遡及適用がスキップされたことを確認（適用開始日が不明確または将来日）
    const ruleChangeSkipped = {
      billingRuleId: 'rule-004',
      customerId: 'cust-D',
      serviceId: 'svc-D',
      newDiscountRate: 0.05,
      effectiveStartDate: '',
      changeDescription: 'Skipped due to unclear date',
    };

    expect(() => applyBillingRuleChange(ruleChangeSkipped)).toThrow(/適用開始日/);

    // 5. 適用開始日がnullの場合もエラー
    const ruleChangeWithNullDate = {
      billingRuleId: 'rule-005',
      customerId: 'cust-E',
      serviceId: 'svc-E',
      newDiscountRate: 0.08,
      effectiveStartDate: null as any,
      changeDescription: 'Null date test',
    };

    expect(() => applyBillingRuleChange(ruleChangeWithNullDate)).toThrow(/適用開始日/);

    // 6. 適用開始日が今日の日付の場合は成功
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const ruleChangeWithToday = {
      billingRuleId: 'rule-006',
      customerId: 'cust-F',
      serviceId: 'svc-F',
      newDiscountRate: 0.12,
      effectiveStartDate: todayDate.toISOString(),
      changeDescription: 'Today effective date',
    };

    const resultToday = applyBillingRuleChange(ruleChangeWithToday);
    expect(resultToday.success).toBe(true);
    expect(resultToday.retroactivelyApplied).toBe(false);
  });
});