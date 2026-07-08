import { determineModelRetrainingNecessity } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  test("SCEN-1538: モデル再学習実行判定基準の定義 - AI判定精度がしきい値を下回った場合、データ更新の必要性が正しく判定される", () => {
    const threshold_accuracy = 80;
    const current_accuracy = 75;
    const model_id = "model_v1_2024_01_15";
    const evaluation_timestamp = new Date("2024-01-15T11:00:00Z");

    const result = determineModelRetrainingNecessity({
      threshold_accuracy: threshold_accuracy,
      current_accuracy: current_accuracy,
      model_id: model_id,
      evaluation_timestamp: evaluation_timestamp,
    });

    expect(result.requires_retraining).toBe(true);
    expect(result.necessity_status).toBe("必要");
    expect(result.display_message).toBe("モデル再学習が必要です");
    expect(result.threshold_accuracy).toBe(80);
    expect(result.current_accuracy).toBe(75);
    expect(result.accuracy_gap).toBe(-5);
    expect(result.recommendation).toBe("データ更新とモデル再学習を実行してください");
    expect(result.log_recorded).toBe(true);
    expect(result.model_id).toBe("model_v1_2024_01_15");
    expect(typeof result.evaluation_timestamp).toBe("string");
  });
});