import { calculateJudgmentVarianceRate } from '../../src/logic/it-1-br-6-2-1';

describe('査定員別の判定ばらつき率と相場乖離傾向の自動集計・分析機能', () => {
  // SCEN-1309: [edge] 判定ばらつき率の算出 - 査定員が2名の場合、判定結果の差分から正確なばらつき率を算出する
  test('査定員2名の判定結果差分から正確なばらつき率40%を算出', () => {
    const assessor_a_id = 'assessor_001';
    const assessor_b_id = 'assessor_002';
    const property_id = 'prop_12345';

    const assessor_a_rating = 'A';
    const assessor_b_rating = 'C';

    const rating_levels = ['A', 'B', 'C', 'D', 'E'];
    const assessor_a_level_index = rating_levels.indexOf(assessor_a_rating);
    const assessor_b_level_index = rating_levels.indexOf(assessor_b_rating);

    const level_difference = Math.abs(assessor_a_level_index - assessor_b_level_index);
    const max_level_count = rating_levels.length;

    const expected_variance_rate = (level_difference / max_level_count) * 100;

    const result = calculateJudgmentVarianceRate({
      assessor_a_rating: assessor_a_rating,
      assessor_b_rating: assessor_b_rating,
      rating_scale: rating_levels,
    });

    expect(result.variance_rate).toBe(40);
    expect(result.level_difference).toBe(2);
    expect(result.max_level_count).toBe(5);
    expect(result.property_id).toBeUndefined();
  });
});