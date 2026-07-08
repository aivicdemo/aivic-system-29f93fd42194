import { detectAnomalousProductivity } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-763: [edge] 査定員別生産性の異常値自動判定機能 - データサンプル数が少ない場合、異常判定が実行されず警告が返される
  test("should return WARNING status with insufficient sample count and skip anomaly detection", () => {
    const insufficient_sample_data = [
      {
        assessor_id: "ASS001",
        assessment_date: "2024-01-15",
        processing_time_minutes: 28,
        completed_count: 4,
      },
    ];

    const result = detectAnomalousProductivity(insufficient_sample_data);

    expect(result.status).toBe("WARNING");
    expect(result.message).toContain("データサンプル数が不足しています");
    expect(result.anomaly_results).toBeNull();
    expect(result.skip_reason).toBe("サンプル数不足");
  });
});