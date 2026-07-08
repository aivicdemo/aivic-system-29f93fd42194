import { calculateAssessmentQualityCheckResult } from '../../src/logic/it-6-2-1-1';

describe('Assessment Quality Check Auto-Judgment - Single Test File', () => {
  // SCEN-742: [normal] 品質チェック自動判定機能 - 判定結果が全ての品質基準を満たすとき合格判定となり確定記録される
  test('SCEN-742: When all quality criteria are met, system auto-judges as pass and records confirmed result', () => {
    const assessment_data = {
      assessment_id: 'ASS-20240115-001',
      price_value: 5000000,
      price_lower_bound: 4500000,
      price_upper_bound: 5500000,
      description_text: 'This is a comprehensive assessment description covering all required fields and details.',
      description_min_length: 50,
      image_quality_score: 95,
      image_quality_threshold: 70,
      category_assigned: 'Building Construction',
      category_expected: 'Building Construction',
      assessor_id: 'ASSR-001',
      assessment_timestamp: '2024-01-15T11:00:00Z',
      region_code: 'JP-13',
      work_type_code: 'BC-001',
      amount_band_code: 'BAND-5M',
    };

    const quality_check_criteria = {
      price_accuracy_threshold_rate: 0.15,
      description_completeness_min_length: 50,
      image_quality_min_score: 70,
      category_accuracy_required: true,
      all_criteria_must_pass: true,
    };

    const result = calculateAssessmentQualityCheckResult(
      assessment_data,
      quality_check_criteria
    );

    expect(result).toEqual({
      assessment_id: 'ASS-20240115-001',
      quality_check_id: expect.any(String),
      price_accuracy_pass: true,
      price_accuracy_rate: expect.closeTo(0.0, 0.01),
      description_completeness_pass: true,
      description_length: 76,
      image_quality_pass: true,
      image_quality_score: 95,
      category_accuracy_pass: true,
      category_assigned: 'Building Construction',
      category_expected: 'Building Construction',
      overall_judgment: 'PASS',
      all_criteria_passed: true,
      judgment_timestamp: expect.any(String),
      confirmed_status: 'CONFIRMED',
      assessor_id: 'ASSR-001',
      persisted: true,
      persisted_timestamp: expect.any(String),
    });

    expect(result.overall_judgment).toBe('PASS');
    expect(result.confirmed_status).toBe('CONFIRMED');
    expect(result.all_criteria_passed).toBe(true);
    expect(result.persisted).toBe(true);
    expect(result.price_accuracy_pass).toBe(true);
    expect(result.description_completeness_pass).toBe(true);
    expect(result.image_quality_pass).toBe(true);
    expect(result.category_accuracy_pass).toBe(true);
  });
});