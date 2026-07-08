import { aggregateDashboardMetrics } from "../../src/logic/it-6-2-1-1";

describe("経営ダッシュボード・査定品質メトリクス自動集計", () => {
  test("SCEN-1322: 稼働率が0%またはnullの場合、ダッシュボード生成エラーを検出", () => {
    // ========== テスト1: 稼働率が0%の場合 ==========
    const assessmentQualityDataSetZeroOccupancy = {
      assessor_id: "assessor_001",
      work_type_code: "WT001",
      amount_band_code: "AB_1M_5M",
      total_assessment_count: 150,
      average_assessment_time_minutes: 25,
      judgment_accuracy_rate: 92.5,
      market_deviation_rate: 5.8,
      occupancy_rate: 0,
      error_count: 2,
      feedback_count: 3,
      measurement_date: "2024-01-15",
      measurement_month: "2024-01",
    };

    let errorResult1: any;
    try {
      aggregateDashboardMetrics(assessmentQualityDataSetZeroOccupancy);
    } catch (err) {
      errorResult1 = err;
    }

    expect(errorResult1).toBeDefined();
    expect(errorResult1.message).toMatch(/稼働率/);
    expect(errorResult1.error_code).toBe("INVALID_OCCUPANCY_RATE");
    expect(errorResult1.occupancy_rate_value).toBe(0);
    expect(errorResult1.timestamp).toBeDefined();

    // ========== テスト2: 稼働率がnullの場合 ==========
    const assessmentQualityDataSetNullOccupancy = {
      assessor_id: "assessor_002",
      work_type_code: "WT002",
      amount_band_code: "AB_5M_10M",
      total_assessment_count: 200,
      average_assessment_time_minutes: 22,
      judgment_accuracy_rate: 94.0,
      market_deviation_rate: 4.2,
      occupancy_rate: null,
      error_count: 1,
      feedback_count: 2,
      measurement_date: "2024-01-15",
      measurement_month: "2024-01",
    };

    let errorResult2: any;
    try {
      aggregateDashboardMetrics(assessmentQualityDataSetNullOccupancy);
    } catch (err) {
      errorResult2 = err;
    }

    expect(errorResult2).toBeDefined();
    expect(errorResult2.message).toMatch(/稼働率/);
    expect(errorResult2.error_code).toBe("INVALID_OCCUPANCY_RATE");
    expect(errorResult2.occupancy_rate_value).toBe(null);
    expect(errorResult2.timestamp).toBeDefined();

    // ========== テスト3: 稼働率が正常値（99.5%）の場合は正常終了 ==========
    const assessmentQualityDataSetValidOccupancy = {
      assessor_id: "assessor_003",
      work_type_code: "WT003",
      amount_band_code: "AB_10M_50M",
      total_assessment_count: 180,
      average_assessment_time_minutes: 28,
      judgment_accuracy_rate: 91.0,
      market_deviation_rate: 6.5,
      occupancy_rate: 99.5,
      error_count: 3,
      feedback_count: 4,
      measurement_date: "2024-01-15",
      measurement_month: "2024-01",
    };

    const result = aggregateDashboardMetrics(assessmentQualityDataSetValidOccupancy);

    expect(result).toBeDefined();
    expect(result.error_code).toBeUndefined();
    expect(result.occupancy_rate).toBe(99.5);
    expect(result.assessor_id).toBe("assessor_003");
    expect(result.total_assessment_count).toBe(180);
    expect(result.average_assessment_time_minutes).toBe(28);
    expect(result.judgment_accuracy_rate).toBe(91.0);
    expect(result.market_deviation_rate).toBe(6.5);
    expect(result.measurement_date).toBe("2024-01-15");
  });
});