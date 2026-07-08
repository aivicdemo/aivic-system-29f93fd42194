import { generateROIReportWithFallback } from '../../src/logic/it-6-2-1-1';

describe('ROI実績レポート自動抽出機能 - 学習データ更新履歴エラーハンドリング', () => {
  // SCEN-1325
  test('学習データ更新履歴が存在しない場合、エラーハンドリングで代替値を適用し、レポート生成が失敗しない', () => {
    const input = {
      reporting_period_start: '2024-01-01',
      reporting_period_end: '2024-01-31',
      initial_headcount: 30,
      assessment_records: [
        {
          assessment_date: '2024-01-15',
          case_id: 'CASE_001',
          assessment_time_minutes: 45,
          quotation_amount: 5000000,
          deviation_rate: 0.08,
          judgment_result: 'APPROVED'
        },
        {
          assessment_date: '2024-01-20',
          case_id: 'CASE_002',
          assessment_time_minutes: 38,
          quotation_amount: 3500000,
          deviation_rate: 0.12,
          judgment_result: 'APPROVED'
        },
        {
          assessment_date: '2024-01-25',
          case_id: 'CASE_003',
          assessment_time_minutes: 52,
          quotation_amount: 6200000,
          deviation_rate: 0.05,
          judgment_result: 'APPROVED'
        }
      ],
      learning_data_update_history: [],
      system_uptime_rate: 0.985,
      ocr_accuracy: 0.92,
      ai_judgment_accuracy: 0.88
    };

    const result = generateROIReportWithFallback(input);

    expect(result).toBeDefined();
    expect(result.report_status).toBe('GENERATED_WITH_FALLBACK');
    expect(result.error_detected).toBe(true);
    expect(result.error_type).toBe('MISSING_LEARNING_DATA_HISTORY');
    expect(result.error_message).toMatch(/学習データ更新履歴/);

    expect(result.fallback_applied).toBe(true);
    expect(result.fallback_learning_data_update_count).toBe(0);
    expect(result.fallback_ocr_accuracy_before_update).toBe(0.92);
    expect(result.fallback_ai_judgment_accuracy_before_update).toBe(0.88);

    const calculation_base_time_per_case = (45 + 38 + 52) / 3;
    const expected_time_reduction_rate =
      ((45 - calculation_base_time_per_case) / 45) * 100;
    expect(result.assessment_time_reduction_rate_percent).toBeCloseTo(
      expected_time_reduction_rate,
      1
    );

    const approved_count = 3;
    const total_count = 3;
    const expected_quality_uniformity_index = (approved_count / total_count) * 100;
    expect(result.quality_uniformity_index_percent).toBeCloseTo(
      expected_quality_uniformity_index,
      1
    );

    expect(result.system_uptime_rate_percent).toBe(98.5);

    expect(result.roi_calculation_basis_valid).toBe(true);
    expect(result.report_completeness_percent).toBeGreaterThanOrEqual(85);

    expect(result.error_log_entry).toBeDefined();
    expect(result.error_log_entry.timestamp).toBeDefined();
    expect(result.error_log_entry.error_code).toBe('ERR_MISSING_LEARNING_HISTORY');
    expect(result.error_log_entry.message).toMatch(/学習データ更新履歴/);
    expect(result.error_log_entry.fallback_action).toBe(
      'APPLIED_DEFAULT_UPDATE_COUNT_ZERO'
    );
    expect(result.error_log_entry.report_still_generated).toBe(true);

    expect(result.assessment_records_processed).toBe(3);
    expect(result.average_assessment_time_minutes).toBeCloseTo(
      calculation_base_time_per_case,
      1
    );
  });
});