import { identifyImprovementThemesAndGuidanceTargets } from '../../src/logic/it-6-2-2-2';

describe('改善テーマ・指導対象者の特定 - 指導対象者が0人の境界値', () => {
  test('SCEN-1080: 指導対象者が0人の場合、改善テーマのみが返される', async () => {
    const assessorPerformanceData = [
      {
        assessor_id: 'assessor_001',
        assessor_name: '査定員A',
        judgment_accuracy: 85.5,
        deviation_rate: 8.2,
        assessment_time_minutes: 28,
        proficiency_level: 'experienced',
      },
      {
        assessor_id: 'assessor_002',
        assessor_name: '査定員B',
        judgment_accuracy: 84.0,
        deviation_rate: 8.5,
        assessment_time_minutes: 29,
        proficiency_level: 'experienced',
      },
    ];

    const performanceThresholds = {
      judgment_accuracy_min: 80.0,
      deviation_rate_max: 12.0,
      assessment_time_max_minutes: 35,
    };

    const improvementThemeCatalog = [
      {
        theme_id: 'theme_001',
        theme_name: '高金額帯見積査定',
        description: '500万円以上の見積査定精度向上',
        priority_score: 85,
        category: 'construction_type',
      },
      {
        theme_id: 'theme_002',
        theme_name: '特殊工法理解',
        description: '特殊工法の市場相場理解',
        priority_score: 78,
        category: 'specialized_knowledge',
      },
      {
        theme_id: 'theme_003',
        theme_name: '地域別相場差異',
        description: '地域別相場差異への対応',
        priority_score: 72,
        category: 'regional_analysis',
      },
    ];

    const mockRequestBody = {
      assessor_performance_data: assessorPerformanceData,
      performance_thresholds: performanceThresholds,
      improvement_theme_catalog: improvementThemeCatalog,
      analysis_period_start_date: '2024-01-01',
      analysis_period_end_date: '2024-01-31',
    };

    const mockResponse = {
      improvement_themes: [
        {
          theme_id: 'theme_001',
          theme_name: '高金額帯見積査定',
          description: '500万円以上の見積査定精度向上',
          priority_score: 85,
          category: 'construction_type',
          selection_reason: 'all_assessors_meet_accuracy_threshold',
        },
        {
          theme_id: 'theme_002',
          theme_name: '特殊工法理解',
          description: '特殊工法の市場相場理解',
          priority_score: 78,
          category: 'specialized_knowledge',
          selection_reason: 'all_assessors_meet_accuracy_threshold',
        },
        {
          theme_id: 'theme_003',
          theme_name: '地域別相場差異',
          description: '地域別相場差異への対応',
          priority_score: 72,
          category: 'regional_analysis',
          selection_reason: 'all_assessors_meet_accuracy_threshold',
        },
      ],
      guidance_targets: [],
      analysis_summary: {
        total_assessors_analyzed: 2,
        assessors_requiring_guidance: 0,
        all_performance_acceptable: true,
        next_review_date: '2024-02-28',
      },
    };

    const result = await identifyImprovementThemesAndGuidanceTargets(mockRequestBody);

    // ステータスコード確認（関数がレスポンス構造を返す場合）
    expect(result).toBeDefined();
    expect(result).toHaveProperty('improvement_themes');
    expect(result).toHaveProperty('guidance_targets');

    // improvement_themesフィールドの確認
    expect(Array.isArray(result.improvement_themes)).toBe(true);
    expect(result.improvement_themes.length).toBe(3);

    // improvement_themesが空配列ではないことを確認
    expect(result.improvement_themes.length).toBeGreaterThan(0);

    // improvement_themesの各要素に必須フィールドが含まれることを確認
    result.improvement_themes.forEach((theme) => {
      expect(theme).toHaveProperty('theme_id');
      expect(theme).toHaveProperty('theme_name');
      expect(theme).toHaveProperty('description');
      expect(theme).toHaveProperty('priority_score');
      expect(theme).toHaveProperty('category');
      expect(typeof theme.theme_id).toBe('string');
      expect(typeof theme.theme_name).toBe('string');
      expect(typeof theme.priority_score).toBe('number');
    });

    // guidance_targetsフィールドの確認
    expect(Array.isArray(result.guidance_targets)).toBe(true);
    expect(result.guidance_targets.length).toBe(0);

    // improvement_themesの内容確認
    const theme_ids = result.improvement_themes.map((t) => t.theme_id);
    expect(theme_ids).toContain('theme_001');
    expect(theme_ids).toContain('theme_002');
    expect(theme_ids).toContain('theme_003');

    // guidance_targets以外に指導対象者関連データが含まれていないことを確認
    expect(result).not.toHaveProperty('target_assessors');
    expect(result).not.toHaveProperty('guidance_candidates');

    // analysis_summaryで全体情報確認
    expect(result).toHaveProperty('analysis_summary');
    expect(result.analysis_summary.total_assessors_analyzed).toBe(2);
    expect(result.analysis_summary.assessors_requiring_guidance).toBe(0);
    expect(result.analysis_summary.all_performance_acceptable).toBe(true);
  });
});