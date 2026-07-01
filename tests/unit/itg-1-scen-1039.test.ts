import { validateSalesReportValidity } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業成果レポート内容妥当性判定', () => {
  // SCEN-1039
  test('受領したレポートの全項目が検証基準を満たすとき妥当性が正常と判定される', () => {
    const sales_report = {
      report_id: 'RPT-2024-001',
      customer_id: 'CUST-001',
      reporting_period_start: '2024-01-01',
      reporting_period_end: '2024-01-31',
      revenue_amount: 500000,
      revenue_amount_min: 0,
      revenue_amount_max: 1000000,
      project_count: 10,
      project_count_min: 0,
      project_count_max: 50,
      achievement_rate: 85.5,
      achievement_rate_min: 0,
      achievement_rate_max: 100,
      completion_rate: 90.0,
      completion_rate_min: 0,
      completion_rate_max: 100,
      customer_satisfaction_score: 4.5,
      customer_satisfaction_score_min: 1,
      customer_satisfaction_score_max: 5,
      required_fields_complete: true,
      data_type_valid: true,
      no_anomalies: true,
    };

    const result = validateSalesReportValidity(sales_report);

    expect(result.validity_status).toBe('normal');
    expect(result.is_approvable).toBe(true);
    expect(result.validation_log).toContain('revenue_amount within range');
    expect(result.validation_log).toContain('project_count within range');
    expect(result.validation_log).toContain('achievement_rate within range');
    expect(result.validation_log).toContain('completion_rate within range');
    expect(result.validation_log).toContain('customer_satisfaction_score within range');
    expect(result.validation_log).toContain('all required fields present');
    expect(result.all_items_meet_criteria).toBe(true);
    expect(result.validation_result).toEqual({
      revenue_check: true,
      project_count_check: true,
      achievement_rate_check: true,
      completion_rate_check: true,
      satisfaction_check: true,
      completeness_check: true,
    });
  });
});