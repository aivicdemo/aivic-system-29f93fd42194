import { aggregateAuditorAccuracyMetrics } from "../../src/logic/it-6-2-1-1";

describe("IT-6-2-1-1: 査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  test("SCEN-873: 許容範囲の閾値が境界値のとき、判定差異を正確に判定する", () => {
    const base_appraisal_amount = 100000;
    const tolerance_threshold_percent = 5;
    const lower_bound = base_appraisal_amount * (1 - tolerance_threshold_percent / 100);
    const upper_bound = base_appraisal_amount * (1 + tolerance_threshold_percent / 100);

    const base_case_input = {
      auditor_a_amount: base_appraisal_amount,
      auditor_b_amount: 105000,
      tolerance_threshold_percent: tolerance_threshold_percent,
      construction_type: "type_A",
      amount_band: "band_100k_200k",
    };

    const result_upper_bound = aggregateAuditorAccuracyMetrics(
      base_case_input
    );
    expect(result_upper_bound.judgment_result).toBe("within_tolerance");
    expect(result_upper_bound.difference_percent).toBe(5.0);

    const lower_bound_input = {
      auditor_a_amount: base_appraisal_amount,
      auditor_b_amount: 95000,
      tolerance_threshold_percent: tolerance_threshold_percent,
      construction_type: "type_A",
      amount_band: "band_100k_200k",
    };

    const result_lower_bound = aggregateAuditorAccuracyMetrics(
      lower_bound_input
    );
    expect(result_lower_bound.judgment_result).toBe("within_tolerance");
    expect(result_lower_bound.difference_percent).toBe(-5.0);

    const exceeds_upper_input = {
      auditor_a_amount: base_appraisal_amount,
      auditor_b_amount: 105001,
      tolerance_threshold_percent: tolerance_threshold_percent,
      construction_type: "type_A",
      amount_band: "band_100k_200k",
    };

    const result_exceeds_upper = aggregateAuditorAccuracyMetrics(
      exceeds_upper_input
    );
    expect(result_exceeds_upper.judgment_result).toBe("exceeds_tolerance");
    expect(result_exceeds_upper.difference_percent).toBeCloseTo(5.001, 2);

    const exceeds_lower_input = {
      auditor_a_amount: base_appraisal_amount,
      auditor_b_amount: 94999,
      tolerance_threshold_percent: tolerance_threshold_percent,
      construction_type: "type_A",
      amount_band: "band_100k_200k",
    };

    const result_exceeds_lower = aggregateAuditorAccuracyMetrics(
      exceeds_lower_input
    );
    expect(result_exceeds_lower.judgment_result).toBe("exceeds_tolerance");
    expect(result_exceeds_lower.difference_percent).toBeCloseTo(-5.001, 2);

    expect(result_upper_bound.judgment_result).not.toBe(
      result_exceeds_upper.judgment_result
    );
    expect(result_lower_bound.judgment_result).not.toBe(
      result_exceeds_lower.judgment_result
    );
  });
});