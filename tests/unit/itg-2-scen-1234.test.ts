import { determineNextStepWithTargetValidation } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-1234
  test('[error] 改善目標値達成判定と次ステップ自動決定 - 改善目標値が定義されていない場合、エラーが返される', () => {
    const assessment_case_id = 'CASE_20240115_001';
    const improvement_target_value = undefined;
    const current_performance_metric = 75.5;
    const performance_metric_unit = 'accuracy_percentage';
    const evaluation_date = new Date('2024-01-15T10:30:00Z');

    expect(() => {
      determineNextStepWithTargetValidation({
        assessment_case_id,
        improvement_target_value,
        current_performance_metric,
        performance_metric_unit,
        evaluation_date,
      });
    }).toThrow(/改善目標値/);
  });
});