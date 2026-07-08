import { aggregateQualityIndicators } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-1194: [edge] 精度低下原因仮説立案機能 - 精度低下が軽微な場合（閾値以下）は原因仮説立案が実行されない
  test("精度低下が閾値以下の場合、原因仮説立案は実行されず軽微メッセージが表示される", () => {
    const input = {
      assessor_id: "A001",
      construction_type: "建築",
      amount_band: "1000-5000万円",
      current_accuracy: 92.5,
      previous_accuracy: 93.0,
      accuracy_decrease_rate: 0.54,
      threshold_rate: 1.0,
      total_cases: 150,
      cases_with_deviation: 12,
      deviation_pattern_classification: "standard",
    };

    const result = aggregateQualityIndicators(input);

    expect(result.hypothesis_generation_executed).toBe(false);
    expect(result.message).toBe(
      "精度低下が軽微なため、原因仮説立案は実行されません"
    );
    expect(result.accuracy_decrease_rate).toBe(0.54);
    expect(result.threshold_rate).toBe(1.0);
    expect(result.decrease_is_below_threshold).toBe(true);
    expect(result.system_log_recorded).toBe(true);
    expect(result.log_message).toMatch(/処理スキップ/);
    expect(result.assessor_id).toBe("A001");
    expect(result.construction_type).toBe("建築");
    expect(result.amount_band).toBe("1000-5000万円");
  });
});