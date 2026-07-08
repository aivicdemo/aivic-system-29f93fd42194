import { identifyCoachingTargets } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-1077: [normal] 改善テーマ・指導対象者の特定 - 金額帯別の判定精度差から指導対象者が正しく特定される
  test('金額帯別の判定精度差に基づいて、改善が必要な指導対象者が正しく特定される', () => {
    const assessor_id_low = 'A001';
    const assessor_id_mid = 'A002';
    const assessor_id_high = 'A003';

    const accuracy_data_low_band = [
      {
        assessor_id: assessor_id_low,
        assessor_name: '新人査定員A',
        price_band: 'low',
        price_band_label: '低額帯（0-500万円）',
        accuracy_rate: 72.5,
        deviation_rate: 8.3,
        deviation_amount: 41500,
        reference_count: 24,
        assessment_time_minutes: 18,
      },
      {
        assessor_id: assessor_id_mid,
        assessor_name: '中堅査定員B',
        price_band: 'low',
        price_band_label: '低額帯（0-500万円）',
        accuracy_rate: 88.2,
        deviation_rate: 3.1,
        deviation_amount: 15500,
        reference_count: 26,
        assessment_time_minutes: 16,
      },
      {
        assessor_id: assessor_id_high,
        assessor_name: 'ベテラン査定員C',
        price_band: 'low',
        price_band_label: '低額帯（0-500万円）',
        accuracy_rate: 91.4,
        deviation_rate: 2.1,
        deviation_amount: 10500,
        reference_count: 28,
        assessment_time_minutes: 15,
      },
    ];

    const accuracy_data_mid_band = [
      {
        assessor_id: assessor_id_low,
        assessor_name: '新人査定員A',
        price_band: 'mid',
        price_band_label: '中額帯（500-2000万円）',
        accuracy_rate: 64.8,
        deviation_rate: 12.7,
        deviation_amount: 127000,
        reference_count: 22,
        assessment_time_minutes: 22,
      },
      {
        assessor_id: assessor_id_mid,
        assessor_name: '中堅査定員B',
        price_band: 'mid',
        price_band_label: '中額帯（500-2000万円）',
        accuracy_rate: 85.6,
        deviation_rate: 4.9,
        deviation_amount: 49000,
        reference_count: 25,
        assessment_time_minutes: 19,
      },
      {
        assessor_id: assessor_id_high,
        assessor_name: 'ベテラン査定員C',
        price_band: 'mid',
        price_band_label: '中額帯（500-2000万円）',
        accuracy_rate: 89.3,
        deviation_rate: 3.4,
        deviation_amount: 34000,
        reference_count: 27,
        assessment_time_minutes: 17,
      },
    ];

    const accuracy_data_high_band = [
      {
        assessor_id: assessor_id_low,
        assessor_name: '新人査定員A',
        price_band: 'high',
        price_band_label: '高額帯（2000万円以上）',
        accuracy_rate: 58.9,
        deviation_rate: 15.2,
        deviation_amount: 228000,
        reference_count: 19,
        assessment_time_minutes: 26,
      },
      {
        assessor_id: assessor_id_mid,
        assessor_name: '中堅査定員B',
        price_band: 'high',
        price_band_label: '高額帯（2000万円以上）',
        accuracy_rate: 82.7,
        deviation_rate: 6.3,
        deviation_amount: 94500,
        reference_count: 24,
        assessment_time_minutes: 21,
      },
      {
        assessor_id: assessor_id_high,
        assessor_name: 'ベテラン査定員C',
        price_band: 'high',
        price_band_label: '高額帯（2000万円以上）',
        accuracy_rate: 87.8,
        deviation_rate: 4.1,
        deviation_amount: 61500,
        reference_count: 26,
        assessment_time_minutes: 19,
      },
    ];

    const all_accuracy_data = [
      ...accuracy_data_low_band,
      ...accuracy_data_mid_band,
      ...accuracy_data_high_band,
    ];

    const accuracy_threshold = 80.0;
    const deviation_rate_threshold = 5.0;

    const result = identifyCoachingTargets({
      accuracy_data: all_accuracy_data,
      accuracy_threshold,
      deviation_rate_threshold,
    });

    expect(result).toBeDefined();
    expect(result.coaching_targets).toBeDefined();
    expect(Array.isArray(result.coaching_targets)).toBe(true);

    const target_for_low_assessor = result.coaching_targets.find(
      (t) => t.assessor_id === assessor_id_low
    );
    expect(target_for_low_assessor).toBeDefined();
    expect(target_for_low_assessor.assessor_name).toBe('新人査定員A');

    expect(target_for_low_assessor.improvement_themes).toBeDefined();
    expect(Array.isArray(target_for_low_assessor.improvement_themes)).toBe(
      true
    );
    expect(target_for_low_assessor.improvement_themes.length).toBeGreaterThan(0);

    const low_band_theme = target_for_low_assessor.improvement_themes.find(
      (t) => t.price_band === 'low'
    );
    expect(low_band_theme).toBeDefined();
    expect(low_band_theme.accuracy_gap).toBe(18.9);
    expect(low_band_theme.theme).toMatch(/精度/);

    const mid_band_theme = target_for_low_assessor.improvement_themes.find(
      (t) => t.price_band === 'mid'
    );
    expect(mid_band_theme).toBeDefined();
    expect(mid_band_theme.accuracy_gap).toBe(24.5);

    const high_band_theme = target_for_low_assessor.improvement_themes.find(
      (t) => t.price_band === 'high'
    );
    expect(high_band_theme).toBeDefined();
    expect(high_band_theme.accuracy_gap).toBe(28.9);

    expect(result.coaching_targets).toHaveLength(1);

    const first_target = result.coaching_targets[0];
    expect(first_target.assessor_id).toBe(assessor_id_low);

    expect(first_target.improvement_themes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          price_band: 'high',
          accuracy_gap: 28.9,
        }),
        expect.objectContaining({
          price_band: 'mid',
          accuracy_gap: 24.5,
        }),
        expect.objectContaining({
          price_band: 'low',
          accuracy_gap: 18.9,
        }),
      ])
    );

    expect(first_target.improvement_themes[0].accuracy_gap).toBe(28.9);
    expect(first_target.improvement_themes[1].accuracy_gap).toBe(24.5);
    expect(first_target.improvement_themes[2].accuracy_gap).toBe(18.9);

    expect(result.summary).toBeDefined();
    expect(result.summary.total_targets_identified).toBe(1);
    expect(result.summary.analysis_timestamp).toBeDefined();
  });
});