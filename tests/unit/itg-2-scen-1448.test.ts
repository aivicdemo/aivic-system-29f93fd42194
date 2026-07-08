import { calculateReadingErrorPriorityScore } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-1448
  test("読取誤り優先度自動スコアリング - 全必須パラメータ欠落時にエラーを発生させる", () => {
    expect(() =>
      calculateReadingErrorPriorityScore({
        impact_range: undefined,
        severity: undefined,
        occurrence_frequency: undefined,
      })
    ).toThrow(/必須パラメータ/);
  });
});