import { detectAnomalousProductivity } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  test("SCEN-764: 異常値判定の閾値設定が無い場合、エラーが返される", () => {
    // 閾値設定が未設定の状態
    const thresholdConfig = null;

    const assessorProductivityData = [
      {
        assessor_id: "ASS001",
        avg_processing_time_minutes: 45,
        monthly_processed_count: 120,
        productivity_index: 2.67,
      },
      {
        assessor_id: "ASS002",
        avg_processing_time_minutes: 55,
        monthly_processed_count: 95,
        productivity_index: 1.73,
      },
    ];

    // 閾値設定が無い場合、エラーが返される
    expect(() =>
      detectAnomalousProductivity(assessorProductivityData, thresholdConfig)
    ).toThrow(/閾値設定/);
  });
});