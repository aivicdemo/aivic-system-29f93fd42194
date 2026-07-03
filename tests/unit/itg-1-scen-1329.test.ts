import { defineValidationRule } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ品質基準・検証ルール定義 - 計算ロジック矛盾検出', () => {
  test('SCEN-1329: 計算ロジックが矛盾する検証ルール定義を検出してエラーを発生させる', () => {
    const contradictoryRuleInput = {
      ruleId: 'rule_001',
      ruleName: '矛盾したアポ数検証',
      targetField: 'appointmentCount',
      conditions: [
        {
          conditionId: 'cond_001',
          fieldName: 'appointmentCount',
          operator: 'greaterThan',
          value: 10,
          logicalOperator: 'AND',
        },
        {
          conditionId: 'cond_002',
          fieldName: 'appointmentCount',
          operator: 'lessThan',
          value: 10,
          logicalOperator: 'AND',
        },
      ],
      calculationLogic: 'appointmentCount > 10 AND appointmentCount < 10',
      description: '論理的に矛盾したルール定義',
    };

    expect(() => defineValidationRule(contradictoryRuleInput)).toThrow(/計算ロジック/);
  });
});