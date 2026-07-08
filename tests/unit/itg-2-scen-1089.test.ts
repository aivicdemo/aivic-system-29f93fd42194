import { assessLearningDataNecessity } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  test("SCEN-1089: AI判定精度の低下と学習データの偏りが同時に検出された場合、優先度が正確に決定される", () => {
    const model_id = "model_20240115_001";
    const ai_accuracy_percent = 68;
    const learning_data_bias_percent = 82;
    const evaluation_timestamp = new Date("2024-01-15T10:30:00Z");

    const result = assessLearningDataNecessity({
      model_id,
      ai_accuracy_percent,
      learning_data_bias_percent,
      evaluation_timestamp,
    });

    expect(result.priority_level).toBe(1);
    expect(result.priority_label).toBe("緊急");

    expect(result.root_cause_factors).toContain("AI精度低下");
    expect(result.root_cause_factors).toContain("学習データ偏り");

    expect(result.detailed_information).toMatch(/AI精度低下と学習データ偏りの複合要因/);

    expect(result.recommended_actions).toBeDefined();
    expect(result.recommended_actions.length).toBeGreaterThan(0);

    const data_recollection_action = result.recommended_actions.find(
      (action) => /学習データの再収集/.test(action.action_name)
    );
    expect(data_recollection_action).toBeDefined();
    expect(data_recollection_action?.action_priority).toBe(1);

    expect(result.ai_accuracy_threshold_exceeded).toBe(true);
    expect(result.learning_data_bias_threshold_exceeded).toBe(true);

    expect(result.assessment_timestamp).toEqual(evaluation_timestamp);
  });
});