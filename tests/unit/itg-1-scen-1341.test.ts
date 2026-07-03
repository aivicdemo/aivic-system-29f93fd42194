import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  consolidateValidationRulesIntoSpecification,
  validateDataAgainstConsolidatedSpec,
  type ValidationRule,
  type ConsolidatedSpecification,
  type ValidationResult,
} from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ標準化仕様書確定 - 複数条件組み合わせ検証ルール統合', () => {
  // SCEN-1341
  test('複数の条件組み合わせ検証ルールが統合仕様に正しく反映され、優先度順序が維持され、定義されたロジックに基づいてデータ検証が正常に実行されること', () => {
    const validationRules: ValidationRule[] = [
      {
        rule_id: 'rule_001',
        rule_name: 'high_value_customer_check',
        conditions: [
          {
            field: 'customer_category',
            operator: 'equals',
            value: 'premium',
          },
          {
            field: 'sales_amount',
            operator: 'greater_than_or_equal',
            value: 1000000,
          },
        ],
        logical_operator: 'AND',
        priority: 1,
        validation_logic:
          'if customer_category == "premium" AND sales_amount >= 1000000 then discount_rate = 0.15',
      },
      {
        rule_id: 'rule_002',
        rule_name: 'industry_specific_check',
        conditions: [
          {
            field: 'industry_type',
            operator: 'in_list',
            value: ['finance', 'insurance'],
          },
          {
            field: 'sales_amount',
            operator: 'less_than',
            value: 500000,
          },
        ],
        logical_operator: 'AND',
        priority: 2,
        validation_logic:
          'if industry_type IN ["finance","insurance"] AND sales_amount < 500000 then require_approval = true',
      },
      {
        rule_id: 'rule_003',
        rule_name: 'mixed_condition_check',
        conditions: [
          {
            field: 'customer_category',
            operator: 'not_equals',
            value: 'inactive',
          },
          {
            field: 'sales_amount',
            operator: 'between',
            value: [100000, 999999],
          },
        ],
        logical_operator: 'OR',
        priority: 3,
        validation_logic:
          'if customer_category != "inactive" OR (sales_amount >= 100000 AND sales_amount <= 999999) then standard_processing = true',
      },
    ];

    const consolidated: ConsolidatedSpecification =
      consolidateValidationRulesIntoSpecification(validationRules);

    expect(consolidated.total_rules).toBe(3);
    expect(consolidated.rules_by_priority.length).toBe(3);
    expect(consolidated.rules_by_priority[0].priority).toBe(1);
    expect(consolidated.rules_by_priority[1].priority).toBe(2);
    expect(consolidated.rules_by_priority[2].priority).toBe(3);

    expect(consolidated.rules_by_priority[0].rule_id).toBe('rule_001');
    expect(consolidated.rules_by_priority[0].conditions.length).toBe(2);
    expect(consolidated.rules_by_priority[0].logical_operator).toBe('AND');

    expect(consolidated.rules_by_priority[1].rule_id).toBe('rule_002');
    expect(consolidated.rules_by_priority[1].conditions.length).toBe(2);
    expect(consolidated.rules_by_priority[1].logical_operator).toBe('AND');

    expect(consolidated.rules_by_priority[2].rule_id).toBe('rule_003');
    expect(consolidated.rules_by_priority[2].conditions.length).toBe(2);
    expect(consolidated.rules_by_priority[2].logical_operator).toBe('OR');

    const testDataHighValue: Record<string, any> = {
      customer_category: 'premium',
      sales_amount: 1500000,
      industry_type: 'retail',
    };

    const resultHighValue: ValidationResult = validateDataAgainstConsolidatedSpec(
      testDataHighValue,
      consolidated
    );

    expect(resultHighValue.is_valid).toBe(true);
    expect(resultHighValue.matched_rules.length).toBe(1);
    expect(resultHighValue.matched_rules[0]).toBe('rule_001');
    expect(resultHighValue.applied_logic).toContain('discount_rate = 0.15');

    const testDataFinance: Record<string, any> = {
      customer_category: 'standard',
      sales_amount: 300000,
      industry_type: 'finance',
    };

    const resultFinance: ValidationResult = validateDataAgainstConsolidatedSpec(
      testDataFinance,
      consolidated
    );

    expect(resultFinance.is_valid).toBe(true);
    expect(resultFinance.matched_rules.length).toBe(1);
    expect(resultFinance.matched_rules[0]).toBe('rule_002');
    expect(resultFinance.applied_logic).toContain('require_approval = true');

    const testDataStandard: Record<string, any> = {
      customer_category: 'standard',
      sales_amount: 500000,
      industry_type: 'retail',
    };

    const resultStandard: ValidationResult = validateDataAgainstConsolidatedSpec(
      testDataStandard,
      consolidated
    );

    expect(resultStandard.is_valid).toBe(true);
    expect(resultStandard.matched_rules.includes('rule_003')).toBe(true);

    const testDataBoundaryMin: Record<string, any> = {
      customer_category: 'standard',
      sales_amount: 100000,
      industry_type: 'retail',
    };

    const resultBoundaryMin: ValidationResult =
      validateDataAgainstConsolidatedSpec(testDataBoundaryMin, consolidated);

    expect(resultBoundaryMin.is_valid).toBe(true);
    expect(resultBoundaryMin.matched_rules.length).toBeGreaterThan(0);

    const testDataBoundaryMax: Record<string, any> = {
      customer_category: 'standard',
      sales_amount: 999999,
      industry_type: 'retail',
    };

    const resultBoundaryMax: ValidationResult =
      validateDataAgainstConsolidatedSpec(testDataBoundaryMax, consolidated);

    expect(resultBoundaryMax.is_valid).toBe(true);
    expect(resultBoundaryMax.matched_rules.length).toBeGreaterThan(0);

    const testDataNullValue: Record<string, any> = {
      customer_category: null,
      sales_amount: 500000,
      industry_type: 'finance',
    };

    const resultNullValue: ValidationResult = validateDataAgainstConsolidatedSpec(
      testDataNullValue,
      consolidated
    );

    expect(resultNullValue.is_valid).toBe(false);
    expect(resultNullValue.error_messages.length).toBeGreaterThan(0);

    const testDataInactive: Record<string, any> = {
      customer_category: 'inactive',
      sales_amount: 250000,
      industry_type: 'retail',
    };

    const resultInactive: ValidationResult = validateDataAgainstConsolidatedSpec(
      testDataInactive,
      consolidated
    );

    expect(resultInactive.is_valid).toBe(false);

    const testDataMultipleMatches: Record<string, any> = {
      customer_category: 'finance',
      sales_amount: 250000,
      industry_type: 'finance',
    };

    const resultMultipleMatches: ValidationResult =
      validateDataAgainstConsolidatedSpec(testDataMultipleMatches, consolidated);

    expect(resultMultipleMatches.is_valid).toBe(true);
    expect(resultMultipleMatches.matched_rules.length).toBeGreaterThanOrEqual(1);

    const testDataOutOfRange: Record<string, any> = {
      customer_category: 'standard',
      sales_amount: 50000,
      industry_type: 'retail',
    };

    const resultOutOfRange: ValidationResult = validateDataAgainstConsolidatedSpec(
      testDataOutOfRange,
      consolidated
    );

    expect(resultOutOfRange.is_valid).toBe(false);

    const specJson: string = JSON.stringify(consolidated, null, 2);
    expect(specJson).toContain('rule_001');
    expect(specJson).toContain('rule_002');
    expect(specJson).toContain('rule_003');
    expect(specJson).toContain('"priority": 1');
    expect(specJson).toContain('"priority": 2');
    expect(specJson).toContain('"priority": 3');

    const ruleById = consolidated.rules_by_priority.find(
      (r) => r.rule_id === 'rule_001'
    );
    expect(ruleById).toBeDefined();
    expect(ruleById?.conditions[0].field).toBe('customer_category');
    expect(ruleById?.conditions[1].field).toBe('sales_amount');

    expect(consolidated.validation_summary).toContain('3 validation rules');
  });
});