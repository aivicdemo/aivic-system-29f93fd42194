import { describe, test, expect } from "@jest/globals";
import { aggregateQualityMetricsByAssessor } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  test("SCEN-744: 相場乖離率が閾値ちょうど0%のとき合格判定される", () => {
    // Arrange
    const assessmentData = {
      assessor_id: "ASS001",
      construction_type: "建築工事",
      amount_band: "1000万円～5000万円",
      deviation_rate: 0,
      deviation_amount: 0,
      reference_data_count: 15,
      reference_price: 3500000,
      assessed_amount: 3500000,
      assessment_time_minutes: 28,
      correction_factor: 1.0,
      judgment_result: "承認",
    };

    const qualityThreshold = {
      deviation_rate_max: 5.0,
      deviation_amount_max: 500000,
      processing_time_max: 45,
      reference_data_count_min: 5,
    };

    // Act
    const result = aggregateQualityMetricsByAssessor(assessmentData, qualityThreshold);

    // Assert
    expect(result.quality_check_result).toBe("合格");
    expect(result.deviation_rate).toBe(0);
    expect(result.deviation_amount).toBe(0);
    expect(result.is_within_threshold).toBe(true);
    expect(result.reference_data_sufficient).toBe(true);
    expect(result.processing_time_acceptable).toBe(true);
    expect(result.overall_status).toBe("OK");
  });
});