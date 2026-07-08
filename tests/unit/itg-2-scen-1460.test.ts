import { describe, test, expect } from '@jest/globals';
import { calculateDeviationConcentrationPriority } from '../../src/logic/it-1-br-2-2-2-1';

describe('査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード - 乖離集中度判定・優先度決定', () => {
  // SCEN-1460: 乖離集中度が判定閾値ちょうどの場合の優先度判定
  test('乖離集中度が判定閾値とちょうど同じ値の場合、定義されたルールに従って正確な優先度レベルが判定される', () => {
    // ケース 1: 乖離集中度が高優先度の上限閾値（70.0%）とちょうど同じ
    const input_high_boundary = {
      region_code: 'REGION_001',
      work_type_code: 'WORK_TYPE_A',
      month: '2024-01',
      deviation_concentration_degree: 70.0,
      sample_count: 150,
      total_deviation_amount: 1050000,
    };

    const result_high_boundary = calculateDeviationConcentrationPriority(input_high_boundary);

    // 乖離集中度 70.0% は高優先度の上限閾値。この値以上は高優先度
    expect(result_high_boundary.priority_level).toBe('HIGH');
    expect(result_high_boundary.priority_score).toBe(85);
    expect(result_high_boundary.reason).toMatch(/閾値/);

    // ケース 2: 乖離集中度が中優先度の上限閾値（50.0%）とちょうど同じ
    const input_medium_boundary = {
      region_code: 'REGION_002',
      work_type_code: 'WORK_TYPE_B',
      month: '2024-01',
      deviation_concentration_degree: 50.0,
      sample_count: 120,
      total_deviation_amount: 800000,
    };

    const result_medium_boundary = calculateDeviationConcentrationPriority(input_medium_boundary);

    // 乖離集中度 50.0% は中優先度の上限閾値。この値以上 70.0% 未満は中優先度
    expect(result_medium_boundary.priority_level).toBe('MEDIUM');
    expect(result_medium_boundary.priority_score).toBe(60);
    expect(result_medium_boundary.reason).toMatch(/閾値/);

    // ケース 3: 乖離集中度が低優先度の上限閾値（30.0%）とちょうど同じ
    const input_low_boundary = {
      region_code: 'REGION_003',
      work_type_code: 'WORK_TYPE_C',
      month: '2024-01',
      deviation_concentration_degree: 30.0,
      sample_count: 90,
      total_deviation_amount: 450000,
    };

    const result_low_boundary = calculateDeviationConcentrationPriority(input_low_boundary);

    // 乖離集中度 30.0% は低優先度の上限閾値。この値以上 50.0% 未満は低優先度
    expect(result_low_boundary.priority_level).toBe('LOW');
    expect(result_low_boundary.priority_score).toBe(35);
    expect(result_low_boundary.reason).toMatch(/閾値/);

    // ケース 4: 乖離集中度が最小閾値（10.0%）とちょうど同じ
    const input_minimum_boundary = {
      region_code: 'REGION_004',
      work_type_code: 'WORK_TYPE_D',
      month: '2024-01',
      deviation_concentration_degree: 10.0,
      sample_count: 50,
      total_deviation_amount: 200000,
    };

    const result_minimum_boundary = calculateDeviationConcentrationPriority(input_minimum_boundary);

    // 乖離集中度 10.0% は最小閾値。この値未満は除外対象（EXCLUDE）、以上は低優先度
    expect(result_minimum_boundary.priority_level).toBe('LOW');
    expect(result_minimum_boundary.priority_score).toBe(20);
    expect(result_minimum_boundary.reason).toMatch(/閾値/);

    // ケース 5: 乖離集中度が最大閾値（90.0%）とちょうど同じ
    const input_maximum_boundary = {
      region_code: 'REGION_005',
      work_type_code: 'WORK_TYPE_E',
      month: '2024-01',
      deviation_concentration_degree: 90.0,
      sample_count: 200,
      total_deviation_amount: 1500000,
    };

    const result_maximum_boundary = calculateDeviationConcentrationPriority(input_maximum_boundary);

    // 乖離集中度 90.0% は最大水準。70.0% 以上は高優先度
    expect(result_maximum_boundary.priority_level).toBe('HIGH');
    expect(result_maximum_boundary.priority_score).toBe(95);
    expect(result_maximum_boundary.reason).toMatch(/閾値/);

    // ケース 6: 複数パターンの境界値検証 - 中優先度と高優先度の境界直上
    const input_just_above_high = {
      region_code: 'REGION_006',
      work_type_code: 'WORK_TYPE_F',
      month: '2024-01',
      deviation_concentration_degree: 70.0000001,
      sample_count: 160,
      total_deviation_amount: 1100000,
    };

    const result_just_above_high = calculateDeviationConcentrationPriority(input_just_above_high);

    // 70.0% を僅かに超過した場合も高優先度
    expect(result_just_above_high.priority_level).toBe('HIGH');
    expect(result_just_above_high.priority_score).toBeGreaterThan(80);

    // ケース 7: 複数パターンの境界値検証 - 低優先度と中優先度の境界直上
    const input_just_above_medium = {
      region_code: 'REGION_007',
      work_type_code: 'WORK_TYPE_G',
      month: '2024-01',
      deviation_concentration_degree: 50.0000001,
      sample_count: 130,
      total_deviation_amount: 850000,
    };

    const result_just_above_medium = calculateDeviationConcentrationPriority(input_just_above_medium);

    // 50.0% を僅かに超過した場合も中優先度
    expect(result_just_above_medium.priority_level).toBe('MEDIUM');
    expect(result_just_above_medium.priority_score).toBeGreaterThan(50);
    expect(result_just_above_medium.priority_score).toBeLessThan(80);

    // ケース 8: 複数パターンの境界値検証 - 低優先度と除外対象の境界直下
    const input_just_below_low = {
      region_code: 'REGION_008',
      work_type_code: 'WORK_TYPE_H',
      month: '2024-01',
      deviation_concentration_degree: 9.9999999,
      sample_count: 45,
      total_deviation_amount: 180000,
    };

    const result_just_below_low = calculateDeviationConcentrationPriority(input_just_below_low);

    // 10.0% 未満は除外対象
    expect(result_just_below_low.priority_level).toBe('EXCLUDE');
    expect(result_just_below_low.priority_score).toBeLessThan(20);

    // ケース 9: 一貫性確認 - 同じ乖離集中度の値で複数回呼び出し
    const consistency_input = {
      region_code: 'REGION_009',
      work_type_code: 'WORK_TYPE_I',
      month: '2024-01',
      deviation_concentration_degree: 60.0,
      sample_count: 140,
      total_deviation_amount: 900000,
    };

    const result_consistency_1 = calculateDeviationConcentrationPriority(consistency_input);
    const result_consistency_2 = calculateDeviationConcentrationPriority(consistency_input);

    // 同じ入力に対して常に同じ結果を返す（一貫性）
    expect(result_consistency_1.priority_level).toBe(result_consistency_2.priority_level);
    expect(result_consistency_1.priority_score).toBe(result_consistency_2.priority_score);
    expect(result_consistency_1.priority_level).toBe('MEDIUM');
    expect(result_consistency_1.priority_score).toBe(70);

    // ケース 10: 境界値ちょうどの場合の理由文に「閾値」が含まれることを確認
    const boundary_reason_input = {
      region_code: 'REGION_010',
      work_type_code: 'WORK_TYPE_J',
      month: '2024-01',
      deviation_concentration_degree: 50.0,
      sample_count: 125,
      total_deviation_amount: 875000,
    };

    const result_boundary_reason = calculateDeviationConcentrationPriority(boundary_reason_input);

    expect(result_boundary_reason.reason).toMatch(/50/);
    expect(result_boundary_reason.reason).toMatch(/中/);
  });
});