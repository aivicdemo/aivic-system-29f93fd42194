import { calculateAssessmentPriorityScore } from '../../src/logic/it-1-br-6-2-1';

describe('査定員別判定ばらつき率と相場乖離傾向の自動集計・分析機能', () => {
  // SCEN-1463: [edge] 優先度スコア算出機能 - 各パラメータが最小値または最大値の場合、スコア算出が正確に行われる
  test('優先度スコア算出機能は最小値・最大値パラメータで正確に計算される', () => {
    // ===== 査定品質スコアを最小値（0）で実行 =====
    const result_quality_min = calculateAssessmentPriorityScore({
      assessment_quality_score: 0,
      urgency_level: 1,
      case_count: 1
    });
    expect(result_quality_min).toBeDefined();
    expect(typeof result_quality_min).toBe('number');
    expect(result_quality_min).toBeGreaterThanOrEqual(0);
    expect(result_quality_min).toBeLessThanOrEqual(100);

    // ===== 査定品質スコアを最大値（100）で実行 =====
    const result_quality_max = calculateAssessmentPriorityScore({
      assessment_quality_score: 100,
      urgency_level: 1,
      case_count: 1
    });
    expect(result_quality_max).toBeDefined();
    expect(typeof result_quality_max).toBe('number');
    expect(result_quality_max).toBeGreaterThanOrEqual(0);
    expect(result_quality_max).toBeLessThanOrEqual(100);
    // 査定品質スコアが高い方が優先度スコアも高い傾向
    expect(result_quality_max).toBeGreaterThanOrEqual(result_quality_min);

    // ===== 緊急度レベルを最小値（1）で実行 =====
    const result_urgency_min = calculateAssessmentPriorityScore({
      assessment_quality_score: 50,
      urgency_level: 1,
      case_count: 1
    });
    expect(result_urgency_min).toBeDefined();
    expect(typeof result_urgency_min).toBe('number');
    expect(result_urgency_min).toBeGreaterThanOrEqual(0);
    expect(result_urgency_min).toBeLessThanOrEqual(100);

    // ===== 緊急度レベルを最大値（5）で実行 =====
    const result_urgency_max = calculateAssessmentPriorityScore({
      assessment_quality_score: 50,
      urgency_level: 5,
      case_count: 1
    });
    expect(result_urgency_max).toBeDefined();
    expect(typeof result_urgency_max).toBe('number');
    expect(result_urgency_max).toBeGreaterThanOrEqual(0);
    expect(result_urgency_max).toBeLessThanOrEqual(100);
    // 緊急度レベルが高い方が優先度スコアも高い傾向
    expect(result_urgency_max).toBeGreaterThanOrEqual(result_urgency_min);

    // ===== 件数パラメータを最小値（1件）で実行 =====
    const result_count_min = calculateAssessmentPriorityScore({
      assessment_quality_score: 50,
      urgency_level: 3,
      case_count: 1
    });
    expect(result_count_min).toBeDefined();
    expect(typeof result_count_min).toBe('number');
    expect(result_count_min).toBeGreaterThanOrEqual(0);
    expect(result_count_min).toBeLessThanOrEqual(100);

    // ===== 件数パラメータを最大値（1000件）で実行 =====
    const result_count_max = calculateAssessmentPriorityScore({
      assessment_quality_score: 50,
      urgency_level: 3,
      case_count: 1000
    });
    expect(result_count_max).toBeDefined();
    expect(typeof result_count_max).toBe('number');
    expect(result_count_max).toBeGreaterThanOrEqual(0);
    expect(result_count_max).toBeLessThanOrEqual(100);
    // 件数が多い方が優先度スコアも高い傾向
    expect(result_count_max).toBeGreaterThanOrEqual(result_count_min);

    // ===== すべてのパラメータを同時に最小値に設定 =====
    const result_all_min = calculateAssessmentPriorityScore({
      assessment_quality_score: 0,
      urgency_level: 1,
      case_count: 1
    });
    expect(result_all_min).toBeDefined();
    expect(typeof result_all_min).toBe('number');
    expect(result_all_min).toBeGreaterThanOrEqual(0);
    expect(result_all_min).toBeLessThanOrEqual(100);

    // ===== すべてのパラメータを同時に最大値に設定 =====
    const result_all_max = calculateAssessmentPriorityScore({
      assessment_quality_score: 100,
      urgency_level: 5,
      case_count: 1000
    });
    expect(result_all_max).toBeDefined();
    expect(typeof result_all_max).toBe('number');
    expect(result_all_max).toBeGreaterThanOrEqual(0);
    expect(result_all_max).toBeLessThanOrEqual(100);
    // すべて最大値のとき、優先度スコアは最も高い
    expect(result_all_max).toBeGreaterThanOrEqual(result_all_min);

    // ===== 計算式の正確性検証 =====
    // 計算式: (assessment_quality_score × 0.4 + urgency_level × 10 + log10(case_count + 1) × 5) / 1.2
    // すべて最大値の場合の期待値: (100 × 0.4 + 5 × 10 + log10(1001) × 5) / 1.2
    // = (40 + 50 + 3.000434 × 5) / 1.2 = (40 + 50 + 15.00217) / 1.2 = 105.00217 / 1.2 ≈ 87.5018
    const expected_all_max = Math.round((100 * 0.4 + 5 * 10 + Math.log10(1001) * 5) / 1.2 * 100) / 100;
    expect(result_all_max).toBeCloseTo(expected_all_max, 1);

    // すべて最小値の場合の期待値: (0 × 0.4 + 1 × 10 + log10(2) × 5) / 1.2
    // = (0 + 10 + 0.30103 × 5) / 1.2 = (10 + 1.50515) / 1.2 = 11.50515 / 1.2 ≈ 9.588
    const expected_all_min = Math.round((0 * 0.4 + 1 * 10 + Math.log10(2) * 5) / 1.2 * 100) / 100;
    expect(result_all_min).toBeCloseTo(expected_all_min, 1);

    // ===== 中間値による再現性検証 =====
    // 同じパラメータセットで複数回実行し、結果が一貫していることを確認
    const result_reproducible_1 = calculateAssessmentPriorityScore({
      assessment_quality_score: 50,
      urgency_level: 3,
      case_count: 100
    });
    const result_reproducible_2 = calculateAssessmentPriorityScore({
      assessment_quality_score: 50,
      urgency_level: 3,
      case_count: 100
    });
    expect(result_reproducible_1).toBe(result_reproducible_2);

    // ===== 各パラメータが境界値に近い値での精度検証 =====
    const result_boundary_quality = calculateAssessmentPriorityScore({
      assessment_quality_score: 0.1,
      urgency_level: 1,
      case_count: 1
    });
    expect(result_boundary_quality).toBeGreaterThan(result_all_min);

    const result_boundary_urgency = calculateAssessmentPriorityScore({
      assessment_quality_score: 100,
      urgency_level: 4.9,
      case_count: 1
    });
    expect(result_boundary_urgency).toBeLessThan(result_quality_max);

    const result_boundary_count = calculateAssessmentPriorityScore({
      assessment_quality_score: 100,
      urgency_level: 5,
      case_count: 999
    });
    expect(result_boundary_count).toBeLessThan(result_all_max);
  });
});