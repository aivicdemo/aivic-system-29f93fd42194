import { describe, test, expect } from "@jest/globals";
import { calculateAssessorProductivityMetrics } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-1278: [edge] 査定員別生産性指標自動計算機能 - 処理件数がゼロの場合、生産性指標が0として正しく計算される
  test("処理件数がゼロの場合、生産性指標が0として計算される", () => {
    const assessor_data = {
      assessor_id: "ASS001",
      assessor_name: "査定員A",
      processed_count: 0,
      total_processing_time_minutes: 0,
      assessment_accuracy_rate: 0,
      quote_deviation_average_rate: 0,
      judgment_consistency_rate: 0,
    };

    const result = calculateAssessorProductivityMetrics(assessor_data);

    expect(result).toEqual({
      assessor_id: "ASS001",
      assessor_name: "査定員A",
      processed_count: 0,
      average_processing_time_minutes: 0,
      productivity_index: 0,
      assessment_accuracy_rate: 0,
      quote_deviation_average_rate: 0,
      judgment_consistency_rate: 0,
      warning_logged: true,
    });

    expect(result.productivity_index).toBe(0);
    expect(result.average_processing_time_minutes).toBe(0);
    expect(result.warning_logged).toBe(true);
  });
});