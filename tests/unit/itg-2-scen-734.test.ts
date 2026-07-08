import { evaluateReferenceDataReliability } from '../../src/logic/it-6-3-1';

describe('査定判定ロジック適用履歴・根拠記録 - 参照データ適切性判定', () => {
  // SCEN-734
  test('過去案件件数・時期・地域が基準範囲内のとき信頼度が高に判定される', () => {
    const input = {
      past_case_count: 30,
      past_case_count_min: 10,
      past_case_count_max: 50,
      past_case_months_ago: 6,
      past_case_months_max: 12,
      target_region: 'Tokyo',
      past_case_region: 'Tokyo',
      adjacent_regions: ['Tokyo', 'Kanagawa', 'Saitama']
    };

    const result = evaluateReferenceDataReliability(input);

    expect(result.reliability_level).toBe('high');
    expect(result.confidence_score).toBeGreaterThanOrEqual(80);
    expect(result.confidence_score).toBeLessThanOrEqual(100);
    expect(result.case_count_status).toBe('within_range');
    expect(result.time_period_status).toBe('within_range');
    expect(result.region_status).toBe('match');
    expect(typeof result.confidence_score).toBe('number');
    expect(typeof result.reliability_level).toBe('string');
  });
});