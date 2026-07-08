import { aggregateAssessmentAccuracyByAppraiser } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-1250
  test('新精度基準が前回精度基準と同値の場合、ロールアウト計画が最小限のフェーズで立案される', () => {
    // Arrange: テストデータ準備
    const previous_accuracy_standard = {
      ocr_read_accuracy_threshold: 92.5,
      ai_judgment_accuracy_threshold: 88.0,
      assessment_time_minutes: 15,
      quality_uniformity_index: 0.85,
    };

    const new_accuracy_standard = {
      ocr_read_accuracy_threshold: 92.5,
      ai_judgment_accuracy_threshold: 88.0,
      assessment_time_minutes: 15,
      quality_uniformity_index: 0.85,
    };

    const appraiser_data = [
      {
        appraiser_id: 'APP001',
        appraiser_name: 'Appraiser A',
        work_type: 'concrete_work',
        amount_range: 'low',
        assessment_count: 120,
        ocr_accuracy: 92.5,
        ai_accuracy: 88.0,
        avg_time_minutes: 15,
        quality_uniformity: 0.85,
      },
      {
        appraiser_id: 'APP002',
        appraiser_name: 'Appraiser B',
        work_type: 'steel_work',
        amount_range: 'mid',
        assessment_count: 95,
        ocr_accuracy: 92.5,
        ai_accuracy: 88.0,
        avg_time_minutes: 15,
        quality_uniformity: 0.85,
      },
      {
        appraiser_id: 'APP003',
        appraiser_name: 'Appraiser C',
        work_type: 'concrete_work',
        amount_range: 'high',
        assessment_count: 60,
        ocr_accuracy: 92.5,
        ai_accuracy: 88.0,
        avg_time_minutes: 15,
        quality_uniformity: 0.85,
      },
    ];

    // Act: ロールアウト計画を自動生成
    const rollout_plan = aggregateAssessmentAccuracyByAppraiser({
      previous_standard: previous_accuracy_standard,
      new_standard: new_accuracy_standard,
      appraiser_assessment_data: appraiser_data,
    });

    // Assert: ロールアウト計画の妥当性を検証
    // 1. 精度基準の変更がないため、フェーズ数は1（最小限）
    expect(rollout_plan.rollout_phases.length).toBe(1);

    // 2. 唯一のフェーズは全体一括展開フェーズ
    expect(rollout_plan.rollout_phases[0].phase_number).toBe(1);
    expect(rollout_plan.rollout_phases[0].phase_name).toBe('全社一括適用');
    expect(rollout_plan.rollout_phases[0].target_scope).toBe('all_departments');

    // 3. フェーズの詳細内容を検証
    expect(rollout_plan.rollout_phases[0].phase_description).toContain('精度基準の変更なし');
    expect(rollout_plan.rollout_phases[0].phase_description).toContain('全社一括適用');

    // 4. 展開開始日と終了日が指定されている
    expect(rollout_plan.rollout_phases[0].start_date).toBeDefined();
    expect(rollout_plan.rollout_phases[0].end_date).toBeDefined();

    // 5. 検証項目が最小限に設定されている
    expect(rollout_plan.rollout_phases[0].verification_items.length).toBeGreaterThan(0);

    // 6. 対象範囲に含まれるアプレイザーが全員
    expect(rollout_plan.rollout_phases[0].target_appraiser_count).toBe(3);

    // 7. 実装期間が短期に設定されている（最小限のため1〜3営業日程度）
    const start = new Date(rollout_plan.rollout_phases[0].start_date);
    const end = new Date(rollout_plan.rollout_phases[0].end_date);
    const duration_business_days = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 5)
    );
    expect(duration_business_days).toBeLessThanOrEqual(3);

    // 8. 計画全体のフェーズ数が最小（1フェーズ）
    expect(rollout_plan.total_phases).toBe(1);

    // 9. 計画の実装難度が低い
    expect(rollout_plan.implementation_complexity).toBe('low');

    // 10. 計画の説明に「最小限」「一括展開」などの旨が記載される
    expect(rollout_plan.plan_summary).toContain('最小限');
    expect(rollout_plan.plan_summary).toContain('一括展開');

    // 11. 段階的フェーズ分割が行われていないことを確認
    expect(rollout_plan.rollout_phases.every(
      (phase) => phase.phase_type === 'full_deployment'
    )).toBe(true);

    // 12. 前回基準と新基準の差異が検出されていない
    expect(rollout_plan.accuracy_standard_changed).toBe(false);

    // 13. 各査定担当者の精度指標が集計されている
    expect(rollout_plan.aggregated_metrics).toBeDefined();
    expect(rollout_plan.aggregated_metrics.total_assessments).toBe(275); // 120 + 95 + 60
    expect(rollout_plan.aggregated_metrics.overall_ocr_accuracy).toBe(92.5);
    expect(rollout_plan.aggregated_metrics.overall_ai_accuracy).toBe(88.0);

    // 14. 工種別の精度指標が集計されている
    expect(rollout_plan.aggregated_metrics.by_work_type).toBeDefined();
    expect(rollout_plan.aggregated_metrics.by_work_type.concrete_work).toBeDefined();
    expect(rollout_plan.aggregated_metrics.by_work_type.steel_work).toBeDefined();

    // 15. 金額帯別の精度指標が集計されている
    expect(rollout_plan.aggregated_metrics.by_amount_range).toBeDefined();
    expect(rollout_plan.aggregated_metrics.by_amount_range.low).toBeDefined();
    expect(rollout_plan.aggregated_metrics.by_amount_range.mid).toBeDefined();
    expect(rollout_plan.aggregated_metrics.by_amount_range.high).toBeDefined();
  });
});