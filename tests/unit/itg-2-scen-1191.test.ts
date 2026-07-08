import { detectAnomalousIndicators } from "../../src/logic/it-1-br-6-2-1";

describe("査定員別の判定ばらつき率と相場乖離傾向の自動集計・分析機能", () => {
  test("SCEN-1191: 閾値の定義が存在しない指標が入力された場合にエラーが返される", () => {
    // 入力：閾値定義が存在しない指標ID
    const undefinedIndicatorInput = {
      indicators: [
        {
          indicatorId: "UNDEFINED_METRIC_001",
          value: 45.5,
          timestamp: "2024-01-15T11:00:00Z",
        },
      ],
    };

    // 期待結果：エラーがスロー
    expect(() => detectAnomalousIndicators(undefinedIndicatorInput)).toThrow(
      /閾値定義/
    );
  });
});