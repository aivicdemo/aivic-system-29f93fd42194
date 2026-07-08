import { determineDataCorrectionScope } from '../../src/logic/it-6-2-2-1';

describe('査定員別・案件別の判定ロジック・乖離パターン履歴の記録・抽出機能', () => {
  // SCEN-1413: [edge] 学習データ修正範囲決定機能 - 誤り原因が特定できない場合、汎用的な学習データ追加方針が提示される
  test('誤り原因が特定できない場合、汎用的な学習データ追加方針を提示する', () => {
    // 前提: 学習データの誤りが検出されたが、原因分析結果が不明またはAmbiguousである状態
    const assessment_input = {
      assessment_id: 'ASS-20240115-001',
      quote_amount: 5000000,
      assessment_date: '2024-01-15T10:30:00Z',
      assessor_id: 'ASE-USR-0042',
      region_code: 'JP-TK',
      work_type_code: 'BUILD-C',
      amount_band_code: 'BAND-5M-10M',
      ocr_confidence_score: 0.62,
      ai_judgment_confidence_score: 0.58,
      deviation_rate_pct: 22.5,
      deviation_amount_jpy: 1125000,
      reference_data_count: 4,
      adjustment_coefficient: 1.08,
      past_projects_data_coverage_pct: 35.0,
      material_price_book_version: 'MPB-2024-Q1',
      material_price_book_recency_days: 87,
      error_cause_analysis_result: 'AMBIGUOUS',
      error_causes_identified: ['DATA_QUALITY_SUSPECTED', 'MODEL_DRIFT_POSSIBLE', 'FORMAT_VARIATION_DETECTED'],
      error_causes_confidence: [0.33, 0.34, 0.33],
      assessor_feedback: 'Multiple potential factors, cannot determine primary cause',
      timestamp: '2024-01-15T10:45:00Z'
    };

    // 実行: 誤り原因が特定できない査定データで修正範囲決定を実行
    const result = determineDataCorrectionScope(assessment_input);

    // 検証1: 結果構造が正しいか
    expect(result).toEqual(
      expect.objectContaining({
        assessment_id: 'ASS-20240115-001',
        decision_status: 'GENERIC_CORRECTION_RECOMMENDED',
        root_cause_identified: false,
        correction_scope_strategy: 'GENERAL_PURPOSE_DATA_ENHANCEMENT',
        timestamp_decided: expect.any(String)
      })
    );

    // 検証2: 提示される方針が汎用的なものであること（特定の原因に依存していない）
    expect(result.correction_scope_strategy).toBe('GENERAL_PURPOSE_DATA_ENHANCEMENT');

    // 検証3: 汎用的な学習データ追加ガイドラインが含まれていること
    expect(result.recommended_data_enhancements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          enhancement_type: 'DATASET_EXPANSION',
          description: expect.stringContaining('データセット拡充')
        }),
        expect.objectContaining({
          enhancement_type: 'FEATURE_DIVERSITY',
          description: expect.stringContaining('特徴量多様化')
        }),
        expect.objectContaining({
          enhancement_type: 'EDGE_CASE_REINFORCEMENT',
          description: expect.stringContaining('エッジケース補強')
        })
      ])
    );

    // 検証4: データセット拡充ガイドラインの内容確認
    const dataset_expansion = result.recommended_data_enhancements.find(
      (e: any) => e.enhancement_type === 'DATASET_EXPANSION'
    );
    expect(dataset_expansion).toEqual(
      expect.objectContaining({
        enhancement_type: 'DATASET_EXPANSION',
        description: expect.stringContaining('データセット拡充'),
        recommended_additional_samples_min: expect.any(Number),
        recommended_additional_samples_max: expect.any(Number),
        estimated_improvement_pct: expect.any(Number),
        priority_rank: 'HIGH'
      })
    );
    expect(dataset_expansion.recommended_additional_samples_min).toBeGreaterThanOrEqual(100);
    expect(dataset_expansion.recommended_additional_samples_max).toBeGreaterThanOrEqual(
      dataset_expansion.recommended_additional_samples_min
    );
    expect(dataset_expansion.estimated_improvement_pct).toBeGreaterThan(0);
    expect(dataset_expansion.estimated_improvement_pct).toBeLessThanOrEqual(8.5);

    // 検証5: 特徴量多様化ガイドラインの内容確認
    const feature_diversity = result.recommended_data_enhancements.find(
      (e: any) => e.enhancement_type === 'FEATURE_DIVERSITY'
    );
    expect(feature_diversity).toEqual(
      expect.objectContaining({
        enhancement_type: 'FEATURE_DIVERSITY',
        description: expect.stringContaining('特徴量多様化'),
        recommended_dimensions: expect.any(Array),
        coverage_improvement_target_pct: expect.any(Number),
        priority_rank: 'MEDIUM'
      })
    );
    expect(feature_diversity.recommended_dimensions).toEqual(
      expect.arrayContaining([
        expect.stringContaining('地域'),
        expect.stringContaining('工種'),
        expect.stringContaining('時期'),
        expect.stringContaining('金額帯')
      ])
    );
    expect(feature_diversity.coverage_improvement_target_pct).toBeGreaterThanOrEqual(40);

    // 検証6: エッジケース補強ガイドラインの内容確認
    const edge_case_reinforcement = result.recommended_data_enhancements.find(
      (e: any) => e.enhancement_type === 'EDGE_CASE_REINFORCEMENT'
    );
    expect(edge_case_reinforcement).toEqual(
      expect.objectContaining({
        enhancement_type: 'EDGE_CASE_REINFORCEMENT',
        description: expect.stringContaining('エッジケース補強'),
        edge_case_categories: expect.any(Array),
        target_sample_ratio_pct: expect.any(Number),
        priority_rank: 'MEDIUM'
      })
    );
    expect(edge_case_reinforcement.edge_case_categories).toEqual(
      expect.arrayContaining([
        expect.stringContaining('低カバレッジ地域'),
        expect.stringContaining('新規工種'),
        expect.stringContaining('季節変動'),
        expect.stringContaining('金額外れ値')
      ])
    );
    expect(edge_case_reinforcement.target_sample_ratio_pct).toBeGreaterThanOrEqual(15);
    expect(edge_case_reinforcement.target_sample_ratio_pct).toBeLessThanOrEqual(25);

    // 検証7: 実装スケジュール情報が含まれていること
    expect(result.implementation_timeline).toEqual(
      expect.objectContaining({
        estimated_days_to_completion: expect.any(Number),
        phase_1_duration_days: expect.any(Number),
        phase_2_duration_days: expect.any(Number),
        phase_3_duration_days: expect.any(Number)
      })
    );
    expect(result.implementation_timeline.estimated_days_to_completion).toBe(
      result.implementation_timeline.phase_1_duration_days +
        result.implementation_timeline.phase_2_duration_days +
        result.implementation_timeline.phase_3_duration_days
    );
    expect(result.implementation_timeline.estimated_days_to_completion).toBeGreaterThanOrEqual(14);
    expect(result.implementation_timeline.estimated_days_to_completion).toBeLessThanOrEqual(30);

    // 検証8: 優先実施項目が明確であること
    expect(result.immediate_actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action_id: expect.any(String),
          action_description: expect.any(String),
          priority: 'HIGH'
        })
      ])
    );
    expect(result.immediate_actions.length).toBeGreaterThanOrEqual(2);

    // 検証9: 成功基準が定義されていること
    expect(result.success_criteria).toEqual(
      expect.objectContaining({
        target_ocr_confidence_score: expect.any(Number),
        target_ai_judgment_confidence_score: expect.any(Number),
        acceptable_deviation_rate_pct: expect.any(Number),
        required_reference_data_count: expect.any(Number)
      })
    );
    expect(result.success_criteria.target_ocr_confidence_score).toBeGreaterThan(0.62);
    expect(result.success_criteria.target_ocr_confidence_score).toBeLessThanOrEqual(0.85);
    expect(result.success_criteria.target_ai_judgment_confidence_score).toBeGreaterThan(0.58);
    expect(result.success_criteria.target_ai_judgment_confidence_score).toBeLessThanOrEqual(0.85);
    expect(result.success_criteria.acceptable_deviation_rate_pct).toBeLessThan(22.5);
    expect(result.success_criteria.required_reference_data_count).toBeGreaterThan(4);

    // 検証10: 提示される方針が複数原因が混在する場合の一般的ベストプラクティスであること
    expect(result.methodological_notes).toEqual(
      expect.arrayContaining([
        expect.stringContaining('複数要因混在'),
        expect.stringContaining('段階的'),
        expect.stringContaining('並行実施')
      ])
    );

    // 検証11: 追跡可能性のためのメタデータが記録されていること
    expect(result).toEqual(
      expect.objectContaining({
        analysis_input_hash: expect.any(String),
        decision_audit_trail: expect.any(Array),
        recorded_by_system_version: expect.any(String)
      })
    );
    expect(result.decision_audit_trail.length).toBeGreaterThanOrEqual(1);

    // 検証12: 結果が ISO 8601 タイムスタンプで記録されていること
    expect(result.timestamp_decided).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
  });
});