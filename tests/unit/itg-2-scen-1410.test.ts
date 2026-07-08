import { determineDataCorrectionRange } from '../../src/logic/it-6-2-2-1';

describe('学習データ修正範囲決定機能', () => {
  // SCEN-1410
  test('OCR誤りの原因が過去案件データ不足の場合、補正対象範囲が正確に特定される', () => {
    // ケース1: 東京地域の鉄筋コンクリート工事データが不足している場合
    const analysis_result_1 = determineDataCorrectionRange({
      error_pattern: 'DATA_SHORTAGE',
      affected_region: 'Tokyo',
      affected_construction_type: 'Reinforced Concrete',
      total_past_projects: 1200,
      past_projects_in_region: 45,
      past_projects_in_type: 180,
      past_projects_in_region_and_type: 8,
      ocr_error_rate_in_region: 12.5,
      ocr_error_rate_in_type: 8.3,
      ocr_error_rate_in_region_and_type: 37.5,
      shortage_threshold_percentage: 5,
      data_shortage_severity: 'HIGH',
      affected_price_range_min: 5000000,
      affected_price_range_max: 50000000,
    });

    expect(analysis_result_1.root_cause_identified).toBe(true);
    expect(analysis_result_1.root_cause_type).toBe('DATA_SHORTAGE');
    expect(analysis_result_1.shortage_percentage).toBe(0.67);
    expect(analysis_result_1.correction_target_range_start).toBe(5000000);
    expect(analysis_result_1.correction_target_range_end).toBe(50000000);
    expect(analysis_result_1.target_region).toBe('Tokyo');
    expect(analysis_result_1.target_construction_type).toBe('Reinforced Concrete');
    expect(analysis_result_1.is_data_shortage_primary_cause).toBe(true);
    expect(analysis_result_1.correction_scope).toEqual({
      region_coverage: ['Tokyo'],
      construction_type_coverage: ['Reinforced Concrete'],
      price_range_coverage: [
        {
          min: 5000000,
          max: 50000000,
        },
      ],
      temporal_coverage: null,
    });
    expect(analysis_result_1.confidence_score).toBeGreaterThanOrEqual(80);

    // ケース2: 大阪地域の土木工事データが不足している場合
    const analysis_result_2 = determineDataCorrectionRange({
      error_pattern: 'DATA_SHORTAGE',
      affected_region: 'Osaka',
      affected_construction_type: 'Civil Engineering',
      total_past_projects: 1200,
      past_projects_in_region: 52,
      past_projects_in_type: 165,
      past_projects_in_region_and_type: 9,
      ocr_error_rate_in_region: 15.4,
      ocr_error_rate_in_type: 9.1,
      ocr_error_rate_in_region_and_type: 44.4,
      shortage_threshold_percentage: 5,
      data_shortage_severity: 'HIGH',
      affected_price_range_min: 3000000,
      affected_price_range_max: 30000000,
    });

    expect(analysis_result_2.root_cause_identified).toBe(true);
    expect(analysis_result_2.root_cause_type).toBe('DATA_SHORTAGE');
    expect(analysis_result_2.shortage_percentage).toBe(0.75);
    expect(analysis_result_2.correction_target_range_start).toBe(3000000);
    expect(analysis_result_2.correction_target_range_end).toBe(30000000);
    expect(analysis_result_2.target_region).toBe('Osaka');
    expect(analysis_result_2.target_construction_type).toBe('Civil Engineering');
    expect(analysis_result_2.is_data_shortage_primary_cause).toBe(true);
    expect(analysis_result_2.correction_scope).toEqual({
      region_coverage: ['Osaka'],
      construction_type_coverage: ['Civil Engineering'],
      price_range_coverage: [
        {
          min: 3000000,
          max: 30000000,
        },
      ],
      temporal_coverage: null,
    });
    expect(analysis_result_2.confidence_score).toBeGreaterThanOrEqual(80);

    // ケース3: 福岡地域の建築工事データが不足している場合
    const analysis_result_3 = determineDataCorrectionRange({
      error_pattern: 'DATA_SHORTAGE',
      affected_region: 'Fukuoka',
      affected_construction_type: 'Building Construction',
      total_past_projects: 1200,
      past_projects_in_region: 38,
      past_projects_in_type: 210,
      past_projects_in_region_and_type: 5,
      ocr_error_rate_in_region: 18.2,
      ocr_error_rate_in_type: 7.6,
      ocr_error_rate_in_region_and_type: 60.0,
      shortage_threshold_percentage: 5,
      data_shortage_severity: 'CRITICAL',
      affected_price_range_min: 2000000,
      affected_price_range_max: 25000000,
    });

    expect(analysis_result_3.root_cause_identified).toBe(true);
    expect(analysis_result_3.root_cause_type).toBe('DATA_SHORTAGE');
    expect(analysis_result_3.shortage_percentage).toBe(0.96);
    expect(analysis_result_3.correction_target_range_start).toBe(2000000);
    expect(analysis_result_3.correction_target_range_end).toBe(25000000);
    expect(analysis_result_3.target_region).toBe('Fukuoka');
    expect(analysis_result_3.target_construction_type).toBe('Building Construction');
    expect(analysis_result_3.is_data_shortage_primary_cause).toBe(true);
    expect(analysis_result_3.correction_scope).toEqual({
      region_coverage: ['Fukuoka'],
      construction_type_coverage: ['Building Construction'],
      price_range_coverage: [
        {
          min: 2000000,
          max: 25000000,
        },
      ],
      temporal_coverage: null,
    });
    expect(analysis_result_3.confidence_score).toBeGreaterThanOrEqual(80);

    // 各ケースで補正対象範囲がそれぞれ正確に一致していることを確認
    expect(
      analysis_result_1.correction_target_range_start ===
        analysis_result_1.affected_price_range_min
    ).toBe(true);
    expect(
      analysis_result_1.correction_target_range_end ===
        analysis_result_1.affected_price_range_max
    ).toBe(true);

    expect(
      analysis_result_2.correction_target_range_start ===
        analysis_result_2.affected_price_range_min
    ).toBe(true);
    expect(
      analysis_result_2.correction_target_range_end ===
        analysis_result_2.affected_price_range_max
    ).toBe(true);

    expect(
      analysis_result_3.correction_target_range_start ===
        analysis_result_3.affected_price_range_min
    ).toBe(true);
    expect(
      analysis_result_3.correction_target_range_end ===
        analysis_result_3.affected_price_range_max
    ).toBe(true);

    // 複数ケースの一貫性確認
    const all_results = [analysis_result_1, analysis_result_2, analysis_result_3];
    all_results.forEach((result) => {
      expect(result.root_cause_identified).toBe(true);
      expect(result.root_cause_type).toBe('DATA_SHORTAGE');
      expect(result.is_data_shortage_primary_cause).toBe(true);
      expect(result.confidence_score).toBeGreaterThanOrEqual(80);
      expect(result.correction_scope.region_coverage.length).toBeGreaterThan(0);
      expect(
        result.correction_scope.construction_type_coverage.length
      ).toBeGreaterThan(0);
      expect(result.correction_scope.price_range_coverage.length).toBe(1);
      expect(
        result.correction_target_range_end > result.correction_target_range_start
      ).toBe(true);
    });
  });
});