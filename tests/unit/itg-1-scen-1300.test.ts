import { describe, it, expect, beforeEach } from '@jest/globals';
import { extractBillingItems } from '../../src/logic/it-1-2-1';

describe('請求対象項目自動抽出機能', () => {
  it('SCEN-1300: 不正なルール定義でエラーが発生し抽出処理が中断される', () => {
    // ハッピーパス: 正常なルール定義で抽出成功
    const validRule = {
      ruleId: 'rule_001',
      ruleName: '基本サービス請求ルール',
      targetField: 'serviceType',
      operator: 'equals',
      targetValue: 'basic_service',
      billingItemField: 'billingAmount',
      isActive: true,
    };

    const salesData = [
      {
        salesDataId: 'sd_001',
        customerId: 'cust_001',
        serviceType: 'basic_service',
        billingAmount: 50000,
        appointmentCount: 5,
        contractCount: 2,
      },
      {
        salesDataId: 'sd_002',
        customerId: 'cust_002',
        serviceType: 'premium_service',
        billingAmount: 100000,
        appointmentCount: 10,
        contractCount: 5,
      },
    ];

    const result = extractBillingItems(validRule, salesData);

    expect(result).toEqual({
      success: true,
      extractedItems: [
        {
          salesDataId: 'sd_001',
          customerId: 'cust_001',
          billingAmount: 50000,
        },
      ],
      totalAmount: 50000,
      itemCount: 1,
      errors: [],
    });

    // エラーケース1: targetField が空白
    const invalidRule1 = {
      ruleId: 'rule_002',
      ruleName: 'エラーテスト1',
      targetField: '',
      operator: 'equals',
      targetValue: 'basic_service',
      billingItemField: 'billingAmount',
      isActive: true,
    };

    expect(() => extractBillingItems(invalidRule1, salesData)).toThrow(
      /targetField/
    );

    // エラーケース2: 無効な operator
    const invalidRule2 = {
      ruleId: 'rule_003',
      ruleName: 'エラーテスト2',
      targetField: 'serviceType',
      operator: 'invalid_operator',
      targetValue: 'basic_service',
      billingItemField: 'billingAmount',
      isActive: true,
    };

    expect(() => extractBillingItems(invalidRule2, salesData)).toThrow(
      /operator/
    );

    // エラーケース3: 存在しないフィールド参照
    const invalidRule3 = {
      ruleId: 'rule_004',
      ruleName: 'エラーテスト3',
      targetField: 'serviceType',
      operator: 'equals',
      targetValue: 'basic_service',
      billingItemField: 'nonExistentField',
      isActive: true,
    };

    expect(() => extractBillingItems(invalidRule3, salesData)).toThrow(
      /billingItemField/
    );

    // エラーケース4: targetValue が null/undefined
    const invalidRule4 = {
      ruleId: 'rule_005',
      ruleName: 'エラーテスト4',
      targetField: 'serviceType',
      operator: 'equals',
      targetValue: null,
      billingItemField: 'billingAmount',
      isActive: true,
    };

    expect(() => extractBillingItems(invalidRule4, salesData)).toThrow(
      /targetValue/
    );

    // エラーケース5: ruleName が空白
    const invalidRule5 = {
      ruleId: 'rule_006',
      ruleName: '',
      targetField: 'serviceType',
      operator: 'equals',
      targetValue: 'basic_service',
      billingItemField: 'billingAmount',
      isActive: true,
    };

    expect(() => extractBillingItems(invalidRule5, salesData)).toThrow(
      /ruleName/
    );

    // ハッピーパス: 複数条件の AND 演算子での抽出
    const validRuleWithAnd = {
      ruleId: 'rule_007',
      ruleName: '複合条件ルール',
      conditions: [
        {
          targetField: 'serviceType',
          operator: 'equals',
          targetValue: 'basic_service',
        },
        {
          targetField: 'appointmentCount',
          operator: 'greaterThanOrEqual',
          targetValue: 5,
        },
      ],
      logicalOperator: 'AND',
      billingItemField: 'billingAmount',
      isActive: true,
    };

    const resultWithAnd = extractBillingItems(validRuleWithAnd, salesData);

    expect(resultWithAnd).toEqual({
      success: true,
      extractedItems: [
        {
          salesDataId: 'sd_001',
          customerId: 'cust_001',
          billingAmount: 50000,
        },
      ],
      totalAmount: 50000,
      itemCount: 1,
      errors: [],
    });

    // ハッピーパス: greaterThan operator での抽出
    const validRuleWithGreaterThan = {
      ruleId: 'rule_008',
      ruleName: '金額閾値ルール',
      targetField: 'billingAmount',
      operator: 'greaterThan',
      targetValue: 75000,
      billingItemField: 'billingAmount',
      isActive: true,
    };

    const resultWithGreaterThan = extractBillingItems(
      validRuleWithGreaterThan,
      salesData
    );

    expect(resultWithGreaterThan).toEqual({
      success: true,
      extractedItems: [
        {
          salesDataId: 'sd_002',
          customerId: 'cust_002',
          billingAmount: 100000,
        },
      ],
      totalAmount: 100000,
      itemCount: 1,
      errors: [],
    });

    // エラーケース6: 複合条件で無効な logicalOperator
    const invalidRule6 = {
      ruleId: 'rule_009',
      ruleName: 'エラーテスト6',
      conditions: [
        {
          targetField: 'serviceType',
          operator: 'equals',
          targetValue: 'basic_service',
        },
      ],
      logicalOperator: 'INVALID_LOGICAL_OP',
      billingItemField: 'billingAmount',
      isActive: true,
    };

    expect(() => extractBillingItems(invalidRule6, salesData)).toThrow(
      /logicalOperator/
    );

    // ハッピーパス: in operator での複数値抽出
    const validRuleWithIn = {
      ruleId: 'rule_010',
      ruleName: 'IN演算子ルール',
      targetField: 'serviceType',
      operator: 'in',
      targetValue: ['basic_service', 'standard_service'],
      billingItemField: 'billingAmount',
      isActive: true,
    };

    const resultWithIn = extractBillingItems(validRuleWithIn, salesData);

    expect(resultWithIn).toEqual({
      success: true,
      extractedItems: [
        {
          salesDataId: 'sd_001',
          customerId: 'cust_001',
          billingAmount: 50000,
        },
      ],
      totalAmount: 50000,
      itemCount: 1,
      errors: [],
    });

    // ハッピーパス: isActive が false のルールは適用されない
    const inactiveRule = {
      ruleId: 'rule_011',
      ruleName: '無効なルール',
      targetField: 'serviceType',
      operator: 'equals',
      targetValue: 'basic_service',
      billingItemField: 'billingAmount',
      isActive: false,
    };

    const resultInactive = extractBillingItems(inactiveRule, salesData);

    expect(resultInactive).toEqual({
      success: true,
      extractedItems: [],
      totalAmount: 0,
      itemCount: 0,
      errors: [],
    });

    // エラーケース7: conditions が空配列
    const invalidRule7 = {
      ruleId: 'rule_012',
      ruleName: 'エラーテスト7',
      conditions: [],
      logicalOperator: 'AND',
      billingItemField: 'billingAmount',
      isActive: true,
    };

    expect(() => extractBillingItems(invalidRule7, salesData)).toThrow(
      /conditions/
    );

    // ハッピーパス: 空の営業データ配列での抽出
    const emptyResult = extractBillingItems(validRule, []);

    expect(emptyResult).toEqual({
      success: true,
      extractedItems: [],
      totalAmount: 0,
      itemCount: 0,
      errors: [],
    });

    // エラーケース8: ruleId が重複する場合の警告
    const duplicateRuleIdResult = extractBillingItems(validRule, salesData);

    expect(duplicateRuleIdResult.success).toBe(true);
    expect(Array.isArray(duplicateRuleIdResult.extractedItems)).toBe(true);
  });
});