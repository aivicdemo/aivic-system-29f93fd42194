import { calculateStatisticalSignificance } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-1227
  test('改善前後の指標が統計的有意性を満たさない場合、追加改善が必要と判定される', () => {
    const before_metrics = {
      sample_size: 100,
      mean: 85.5,
      std_dev: 5.2,
    };

    const after_metrics = {
      sample_size: 100,
      mean: 86.2,
      std_dev: 5.1,
    };

    const significance_level = 0.05;

    const result = calculateStatisticalSignificance(
      before_metrics,
      after_metrics,
      significance_level,
    );

    expect(result.is_significant).toBe(false);
    expect(result.p_value).toBeGreaterThan(0.05);
    expect(result.message).toMatch(/統計的有意性/);
    expect(result.status).toBe('追加改善必要');
    expect(result.improvement_needed).toBe(true);
  });
});