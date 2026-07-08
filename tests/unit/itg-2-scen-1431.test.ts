import { calculateAccuracyImprovement } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-1431: [edge] 修正前後精度改善度計測・可視化機能 - 修正後精度が修正前と同一の場合に改善度0として正常に計測される
  test("修正前後の精度が同一の場合、改善度0として計測・可視化されること", () => {
    const pre_accuracy = 70.5;
    const post_accuracy = 70.5;

    const improvement = calculateAccuracyImprovement({
      pre_accuracy,
      post_accuracy,
    });

    expect(improvement.improvement_rate).toBe(0);
    expect(improvement.improvement_status).toBe("変化なし");
    expect(improvement.visualization_display).toEqual({
      improvement_percentage: "0%",
      status_label: "変化なし",
      indicator_color: "neutral",
    });
  });
});