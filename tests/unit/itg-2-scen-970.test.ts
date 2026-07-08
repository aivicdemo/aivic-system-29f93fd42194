import { evaluateStaffingScenarios } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-970
  test('翌月応援要請の必要性判定・配置シナリオ選択 - 複数の配置シナリオから最適案（最小人員で要件満たし、コスト最小）が選択される', () => {
    const scenarios = [
      {
        scenarioId: 'A',
        requiredStaffCount: 10,
        costMillionYen: 10.0,
      },
      {
        scenarioId: 'B',
        requiredStaffCount: 8,
        costMillionYen: 9.0,
      },
      {
        scenarioId: 'C',
        requiredStaffCount: 12,
        costMillionYen: 8.0,
      },
    ];

    const businessRequirements = {
      minimumRequiredStaff: 8,
      targetCostMillionYen: 9.5,
    };

    const result = evaluateStaffingScenarios(scenarios, businessRequirements);

    expect(result.selectedScenarioId).toBe('B');
    expect(result.selectedScenario.requiredStaffCount).toBe(8);
    expect(result.selectedScenario.costMillionYen).toBe(9.0);
    expect(result.staffFulfillmentRate).toBe(100);
    expect(result.costEfficiencyScore).toBeGreaterThanOrEqual(95);
    expect(result.rationale).toContain('要件を満たす最小人員');
    expect(result.rationale).toContain('コスト効率');
    expect(result.meetsBusinessRequirements.minimumStaffMet).toBe(true);
    expect(result.meetsBusinessRequirements.costWithinBudget).toBe(true);
  });
});