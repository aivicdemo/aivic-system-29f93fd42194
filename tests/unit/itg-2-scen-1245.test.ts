import { generateStakeholderCustomizationReport } from '../../src/logic/it-1-br-2-2-2-1';

describe('査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード', () => {
  test('SCEN-1245: ステークホルダー区分が空の場合、デフォルトフォーマットでレポートが生成される', () => {
    // Arrange
    const assessment_start_date = '2024-01-01';
    const assessment_end_date = '2024-01-31';
    const assessment_type = 'monthly';
    const stakeholder_classification = null;
    const report_generation_timestamp = '2024-02-01T09:00:00Z';

    // Act
    const report = generateStakeholderCustomizationReport({
      assessment_start_date,
      assessment_end_date,
      assessment_type,
      stakeholder_classification,
      report_generation_timestamp,
    });

    // Assert - レポートが正常に生成される
    expect(report).toBeDefined();
    expect(report.report_id).toBeDefined();
    expect(typeof report.report_id).toBe('string');

    // Assert - ステークホルダー区分が空の場合、デフォルトフォーマットが適用される
    expect(report.format_type).toBe('default');
    expect(report.template_name).toBe('standard_template');

    // Assert - レポートに必須項目がすべて含まれている
    expect(report.assessment_period_start).toBe(assessment_start_date);
    expect(report.assessment_period_end).toBe(assessment_end_date);
    expect(report.assessment_category).toBe(assessment_type);
    expect(report.stakeholder_target).toBe('all_stakeholders');

    // Assert - レポートのレイアウト・カラースキーム・フォントが標準仕様である
    expect(report.layout_style).toBe('standard');
    expect(report.color_scheme).toBe('default_colors');
    expect(report.font_family).toBe('standard_font');

    // Assert - エラーフラグが立っていない（正常生成）
    expect(report.generation_status).toBe('success');
    expect(report.error_occurred).toBe(false);
    expect(report.error_message).toBeNull();

    // Assert - レポート生成タイムスタンプが記録されている
    expect(report.generated_at).toBe(report_generation_timestamp);

    // Assert - レポート内容の完全性が確認できる
    expect(report.required_sections_count).toBe(5);
    expect(report.required_sections_included).toEqual([
      'executive_summary',
      'assessor_performance_metrics',
      'assessment_accuracy_details',
      'assessment_timeline',
      'quality_indicators',
    ]);
  });
});