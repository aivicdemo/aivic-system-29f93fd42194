import { describe, test, expect } from '@jest/globals';
import {
  diagnoseQualityDegradation,
} from '../../src/logic/it-6-2-2-2';

describe('品質低下原因の自動診断と配置調整・改善施策提示', () => {
  // SCEN-978
  test('判定ばらつき率が閾値を下回った場合、査定員能力差として診断され教育対象者と学習データ更新優先度が提示される', () => {
    // 前提: 月次査定データが蓄積され、複数の査定員による判定結果が記録されている状態
    // 発生条件: 判定ばらつき率が閾値（10%）を下回る場合
    // 期待結果: 原因が査定員能力差と診断され、教育対象者リストが能力差レベル順に表示される

    const input = {
      monthly_data: [
        {
          assessor_id: 'A001',
          judgement_variance_rate: 8.5,
          deviation_from_market: 2.3,
          processing_time_minutes: 45,
          case_count: 85,
        },
        {
          assessor_id: 'A002',
          judgement_variance_rate: 7.2,
          deviation_from_market: 1.8,
          processing_time_minutes: 52,
          case_count: 78,
        },
        {
          assessor_id: 'A003',
          judgement_variance_rate: 12.1,
          deviation_from_market: 3.5,
          processing_time_minutes: 38,
          case_count: 92,
        },
        {
          assessor_id: 'A004',
          judgement_variance_rate: 6.9,
          deviation_from_market: 1.5,
          processing_time_minutes: 48,
          case_count: 88,
        },
      ],
      variance_threshold_percent: 10,
      data_collection_period_days: 30,
      assessment_date: '2024-01-31T23:59:59Z',
    };

    const result = diagnoseQualityDegradation(input);

    // 診断結果が返されることを確認
    expect(result).toBeDefined();
    expect(result.diagnosis_status).toBe('completed');

    // 判定ばらつき率が閾値を下回った場合、原因が査定員能力差と診断される
    expect(result.root_cause_category).toBe('assessor_capability_gap');

    // 教育対象者リストが能力差レベル順に表示される
    // 判定ばらつき率が低い（精度が高い）順に上位、高い（精度が低い）順に下位
    expect(result.education_target_assessors).toBeDefined();
    expect(result.education_target_assessors.length).toBe(4);

    // 対象者が能力差レベル順（判定ばらつき率降順）にソートされていることを確認
    const sorted_by_variance = result.education_target_assessors;
    expect(sorted_by_variance[0].assessor_id).toBe('A003'); // variance: 12.1
    expect(sorted_by_variance[1].assessor_id).toBe('A001'); // variance: 8.5
    expect(sorted_by_variance[2].assessor_id).toBe('A002'); // variance: 7.2
    expect(sorted_by_variance[3].assessor_id).toBe('A004'); // variance: 6.9

    // 各教育対象者の学習データ更新優先度ランキングが提示される
    expect(result.education_target_assessors[0].learning_data_update_priority_score).toBeDefined();
    expect(result.education_target_assessors[0].learning_data_update_priority_score).toBeGreaterThan(0);
    expect(result.education_target_assessors[0].learning_data_update_priority_score).toBeLessThanOrEqual(100);

    // 優先度スコアが高い順に並び替えられていることを確認
    // A003: variance 12.1, deviation 3.5 → 優先度スコア 85
    // A001: variance 8.5, deviation 2.3 → 優先度スコア 62
    // A002: variance 7.2, deviation 1.8 → 優先度スコア 48
    // A004: variance 6.9, deviation 1.5 → 優先度スコア 35
    expect(result.education_target_assessors[0].learning_data_update_priority_score).toBe(85);
    expect(result.education_target_assessors[1].learning_data_update_priority_score).toBe(62);
    expect(result.education_target_assessors[2].learning_data_update_priority_score).toBe(48);
    expect(result.education_target_assessors[3].learning_data_update_priority_score).toBe(35);

    // 改善施策が提示されることを確認
    expect(result.improvement_measures).toBeDefined();
    expect(result.improvement_measures.length).toBeGreaterThan(0);

    // 改善施策の詳細構造を確認
    const measure = result.improvement_measures[0];
    expect(measure.measure_id).toBeDefined();
    expect(measure.target_assessor_id).toBe('A003');
    expect(measure.training_content).toBeDefined();
    expect(measure.training_content.length).toBeGreaterThan(0);
    expect(measure.training_material_url).toBeDefined();
    expect(measure.recommended_training_hours).toBeGreaterThan(0);
    expect(measure.priority_level).toBe('high');

    // A003向けの訓練内容: 判定基準の統一、相場乖離判断スキル向上
    expect(measure.training_content).toContain('judgement_standard_alignment');
    expect(measure.training_content).toContain('market_deviation_skill');

    // A001向け改善施策も確認
    const measure_a001 = result.improvement_measures.find((m) => m.target_assessor_id === 'A001');
    expect(measure_a001).toBeDefined();
    expect(measure_a001.recommended_training_hours).toBe(6);
    expect(measure_a001.priority_level).toBe('medium');

    // 診断結果の信頼度スコアを確認
    expect(result.diagnosis_confidence_score).toBeGreaterThanOrEqual(0);
    expect(result.diagnosis_confidence_score).toBeLessThanOrEqual(100);
    expect(result.diagnosis_confidence_score).toBe(92);

    // 実施推奨時期が提示されることを確認
    expect(result.recommended_implementation_date).toBeDefined();
    expect(result.recommended_implementation_date).toBe('2024-02-07T09:00:00Z');

    // システムが判定ばらつき率の詳細分析結果を提供していることを確認
    expect(result.variance_analysis_detail).toBeDefined();
    expect(result.variance_analysis_detail.average_variance_rate).toBe(8.675);
    expect(result.variance_analysis_detail.max_variance_rate).toBe(12.1);
    expect(result.variance_analysis_detail.min_variance_rate).toBe(6.9);
    expect(result.variance_analysis_detail.threshold_value).toBe(10);
    expect(result.variance_analysis_detail.below_threshold_count).toBe(4);

    // 学習データ更新優先度ランキング情報を確認
    expect(result.learning_data_update_priority_ranking).toBeDefined();
    expect(result.learning_data_update_priority_ranking.length).toBe(4);
    expect(result.learning_data_update_priority_ranking[0].rank).toBe(1);
    expect(result.learning_data_update_priority_ranking[0].assessor_id).toBe('A003');
    expect(result.learning_data_update_priority_ranking[0].priority_score).toBe(85);
    expect(result.learning_data_update_priority_ranking[0].recommended_data_categories).toContain(
      'market_comparison_cases'
    );
  });
});