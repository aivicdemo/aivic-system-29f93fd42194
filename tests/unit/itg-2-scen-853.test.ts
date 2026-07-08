import { analyzeDeviationPatterns } from '../../src/logic/it-6-2-2-2';

describe('査定員別判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-853
  test('判定逸脱パターン特定機能 - 判定ばらつきから逸脱パターンが特定され、是正指示対象者と教育内容が明確化される', () => {
    // 複数の査定案件における判定結果データ
    const assessment_cases = [
      {
        case_id: 'CASE-001',
        construction_type: '鉄骨造',
        price_band: '1000-5000万円',
        region: '関東',
        assessor_id: 'ASS-001',
        quoted_amount: 3000,
        market_price: 2800,
        deviation_rate: 7.1,
        assessor_judgment: 'APPROVE',
        ai_judgment: 'APPROVE',
        judgment_match: true,
        assessment_time_minutes: 25,
      },
      {
        case_id: 'CASE-002',
        construction_type: '鉄骨造',
        price_band: '1000-5000万円',
        region: '関東',
        assessor_id: 'ASS-002',
        quoted_amount: 3200,
        market_price: 2800,
        deviation_rate: 14.3,
        assessor_judgment: 'REJECT',
        ai_judgment: 'APPROVE',
        judgment_match: false,
        assessment_time_minutes: 18,
      },
      {
        case_id: 'CASE-003',
        construction_type: '鉄骨造',
        price_band: '1000-5000万円',
        region: '関東',
        assessor_id: 'ASS-001',
        quoted_amount: 2900,
        market_price: 2800,
        deviation_rate: 3.6,
        assessor_judgment: 'APPROVE',
        ai_judgment: 'APPROVE',
        judgment_match: true,
        assessment_time_minutes: 22,
      },
      {
        case_id: 'CASE-004',
        construction_type: '鉄骨造',
        price_band: '1000-5000万円',
        region: '関東',
        assessor_id: 'ASS-003',
        quoted_amount: 3500,
        market_price: 2800,
        deviation_rate: 25.0,
        assessor_judgment: 'REJECT',
        ai_judgment: 'APPROVE',
        judgment_match: false,
        assessment_time_minutes: 35,
      },
      {
        case_id: 'CASE-005',
        construction_type: '鉄骨造',
        price_band: '1000-5000万円',
        region: '関東',
        assessor_id: 'ASS-002',
        quoted_amount: 2700,
        market_price: 2800,
        deviation_rate: -3.6,
        assessor_judgment: 'APPROVE',
        ai_judgment: 'APPROVE',
        judgment_match: true,
        assessment_time_minutes: 20,
      },
      {
        case_id: 'CASE-006',
        construction_type: '鉄骨造',
        price_band: '1000-5000万円',
        region: '関東',
        assessor_id: 'ASS-003',
        quoted_amount: 4000,
        market_price: 2800,
        deviation_rate: 42.9,
        assessor_judgment: 'REJECT',
        ai_judgment: 'APPROVE',
        judgment_match: false,
        assessment_time_minutes: 40,
      },
      {
        case_id: 'CASE-007',
        construction_type: '鉄骨造',
        price_band: '1000-5000万円',
        region: '関東',
        assessor_id: 'ASS-001',
        quoted_amount: 2850,
        market_price: 2800,
        deviation_rate: 1.8,
        assessor_judgment: 'APPROVE',
        ai_judgment: 'APPROVE',
        judgment_match: true,
        assessment_time_minutes: 23,
      },
      {
        case_id: 'CASE-008',
        construction_type: '鉄骨造',
        price_band: '1000-5000万円',
        region: '関東',
        assessor_id: 'ASS-002',
        quoted_amount: 3300,
        market_price: 2800,
        deviation_rate: 17.9,
        assessor_judgment: 'REJECT',
        ai_judgment: 'APPROVE',
        judgment_match: false,
        assessment_time_minutes: 28,
      },
    ];

    // 判定ばらつき分析を実行
    const analysis_result = analyzeDeviationPatterns({
      cases: assessment_cases,
      allowable_deviation_rate: 15.0,
      matching_ratio_threshold: 0.8,
      analysis_period: '2024-01-01_2024-01-31',
      analysis_target_construction_types: ['鉄骨造'],
      analysis_target_regions: ['関東'],
    });

    // === 逸脱パターン検出結果の検証 ===

    // 逸脱パターンが複数検出されていることを確認
    expect(analysis_result.detected_deviation_patterns).toBeDefined();
    expect(Array.isArray(analysis_result.detected_deviation_patterns)).toBe(true);
    expect(analysis_result.detected_deviation_patterns.length).toBeGreaterThan(0);

    // 逸脱パターンの内容を確認
    const pattern_types = analysis_result.detected_deviation_patterns.map(
      (p: any) => p.pattern_type
    );
    expect(pattern_types).toContain('HIGH_DEVIATION_REJECTION');
    expect(pattern_types).toContain('EXCESSIVE_DEVIATION_RATE');

    // === 是正指示対象者の特定 ===

    // 逸脱パターンに関連する査定担当者が特定されていることを確認
    expect(analysis_result.corrective_instruction_targets).toBeDefined();
    expect(Array.isArray(analysis_result.corrective_instruction_targets)).toBe(true);

    // ASS-003 が最も多くの逸脱パターンを有しているため対象者として特定されることを確認
    const ass_003_target = analysis_result.corrective_instruction_targets.find(
      (t: any) => t.assessor_id === 'ASS-003'
    );
    expect(ass_003_target).toBeDefined();
    expect(ass_003_target.deviation_cases_count).toBe(2);
    expect(ass_003_target.max_deviation_rate).toBe(42.9);

    // ASS-002 も逸脱パターンを有しているため対象者として特定されることを確認
    const ass_002_target = analysis_result.corrective_instruction_targets.find(
      (t: any) => t.assessor_id === 'ASS-002'
    );
    expect(ass_002_target).toBeDefined();
    expect(ass_002_target.deviation_cases_count).toBe(2);

    // ASS-001 は逸脱パターンが少ないため対象外
    const ass_001_target = analysis_result.corrective_instruction_targets.find(
      (t: any) => t.assessor_id === 'ASS-001'
    );
    expect(ass_001_target).toBeUndefined();

    // === 教育内容の自動生成・対応付け ===

    // 是正指示対象者ごとの教育内容が対応付けられていることを確認
    expect(analysis_result.education_mapping).toBeDefined();
    expect(Array.isArray(analysis_result.education_mapping)).toBe(true);

    // ASS-003 向けの教育内容
    const ass_003_education = analysis_result.education_mapping.find(
      (m: any) => m.assessor_id === 'ASS-003'
    );
    expect(ass_003_education).toBeDefined();
    expect(ass_003_education.education_topics).toBeDefined();
    expect(Array.isArray(ass_003_education.education_topics)).toBe(true);
    expect(ass_003_education.education_topics.length).toBeGreaterThan(0);
    expect(ass_003_education.education_topics).toContain('EXCESSIVE_DEVIATION_REJECTION_CRITERIA');

    // ASS-002 向けの教育内容
    const ass_002_education = analysis_result.education_mapping.find(
      (m: any) => m.assessor_id === 'ASS-002'
    );
    expect(ass_002_education).toBeDefined();
    expect(ass_002_education.education_topics).toBeDefined();
    expect(Array.isArray(ass_002_education.education_topics)).toBe(true);

    // === 是正指示対象者と教育内容の対応関係検証 ===

    // すべての是正指示対象者に対して教育内容が対応付けられていることを確認
    for (const target of analysis_result.corrective_instruction_targets) {
      const education = analysis_result.education_mapping.find(
        (m: any) => m.assessor_id === target.assessor_id
      );
      expect(education).toBeDefined();
      expect(education.education_topics.length).toBeGreaterThan(0);
    }

    // === レポート出力形式の検証 ===

    expect(analysis_result.report_output).toBeDefined();
    expect(analysis_result.report_output.summary).toBeDefined();
    expect(analysis_result.report_output.summary.total_cases_analyzed).toBe(8);
    expect(analysis_result.report_output.summary.deviation_pattern_count).toBe(
      analysis_result.detected_deviation_patterns.length
    );
    expect(analysis_result.report_output.summary.corrective_instruction_target_count).toBe(
      analysis_result.corrective_instruction_targets.length
    );

    expect(analysis_result.report_output.detail_sections).toBeDefined();
    expect(analysis_result.report_output.detail_sections.deviation_patterns).toBeDefined();
    expect(analysis_result.report_output.detail_sections.corrective_instruction_mapping).toBeDefined();
    expect(
      analysis_result.report_output.detail_sections.corrective_instruction_mapping.mappings
    ).toBeDefined();
    expect(
      Array.isArray(
        analysis_result.report_output.detail_sections.corrective_instruction_mapping.mappings
      )
    ).toBe(true);

    // === 具体的な対応関係の検証 ===

    // ASS-003: 高度な逸脱（42.9%）に対する是正内容
    const ass_003_mapping =
      analysis_result.report_output.detail_sections.corrective_instruction_mapping.mappings.find(
        (m: any) => m.assessor_id === 'ASS-003'
      );
    expect(ass_003_mapping).toBeDefined();
    expect(ass_003_mapping.deviation_pattern_types).toContain('EXCESSIVE_DEVIATION_RATE');
    expect(ass_003_mapping.education_priority).toBe('HIGH');

    // === 完全性チェック ===

    // すべての逸脱パターンに関連する情報が含まれていることを確認
    for (const pattern of analysis_result.detected_deviation_patterns) {
      expect(pattern.pattern_type).toBeDefined();
      expect(pattern.related_assessor_ids).toBeDefined();
      expect(Array.isArray(pattern.related_assessor_ids)).toBe(true);
      expect(pattern.related_assessor_ids.length).toBeGreaterThan(0);
    }

    // === 精度指標の検証 ===

    expect(analysis_result.quality_metrics).toBeDefined();
    expect(analysis_result.quality_metrics.judgment_matching_ratio).toBeDefined();
    expect(typeof analysis_result.quality_metrics.judgment_matching_ratio).toBe('number');
    expect(analysis_result.quality_metrics.judgment_matching_ratio).toBeGreaterThanOrEqual(0);
    expect(analysis_result.quality_metrics.judgment_matching_ratio).toBeLessThanOrEqual(100);

    // 実績値の検証: 8件中5件が一致 = 62.5%
    expect(analysis_result.quality_metrics.judgment_matching_ratio).toBe(62.5);

    // === 逸脱パターンの詳細検証 ===

    // HIGH_DEVIATION_REJECTION パターンの詳細確認
    const high_deviation_pattern = analysis_result.detected_deviation_patterns.find(
      (p: any) => p.pattern_type === 'HIGH_DEVIATION_REJECTION'
    );
    if (high_deviation_pattern) {
      expect(high_deviation_pattern.related_assessor_ids).toContain('ASS-003');
      expect(high_deviation_pattern.related_assessor_ids).toContain('ASS-002');
      expect(high_deviation_pattern.pattern_description).toBeDefined();
    }

    // === 出力結果の整合性 ===

    // 是正指示対象者数と教育マッピング数が一致することを確認
    expect(analysis_result.corrective_instruction_targets.length).toBe(
      analysis_result.education_mapping.length
    );

    // レポート出力に含まれる是正指示マッピング数が正確であることを確認
    expect(
      analysis_result.report_output.detail_sections.corrective_instruction_mapping.mappings.length
    ).toBe(analysis_result.corrective_instruction_targets.length);

    // === 最終的な検証 ===

    // レポート全体が有効な状態であることを確認
    expect(analysis_result.report_output.generated_at).toBeDefined();
    expect(typeof analysis_result.report_output.generated_at).toBe('string');
    expect(analysis_result.report_output.status).toBe('COMPLETED');
  });
});