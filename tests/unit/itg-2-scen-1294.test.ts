import { evaluateLearningDataQualityRisk } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-1294
  test('過去案件データのカバレッジが50%未満の場合、リスクレベルを「HIGH」と判定する', () => {
    const learning_data_set = {
      coverage_rate: 45,
      data_count: 450,
      time_period_days: 90,
      regional_coverage_rate: 65,
      construction_type_coverage_rate: 70,
      data_quality_score: 78,
      missing_rate: 8,
      duplicate_rate: 2,
      anomaly_rate: 5,
    };

    const result = evaluateLearningDataQualityRisk(learning_data_set);

    expect(result.risk_level).toBe('HIGH');
    expect(result.is_quality_meeting_requirement).toBe(false);
    expect(result.risk_warning_message).toMatch(/カバレッジ|カバレッジ率|カバレッジ/);
    expect(typeof result.recommended_action).toBe('string');
    expect(result.recommended_action.length).toBeGreaterThan(0);
  });
});