import { normalizeAdjustmentRanges } from "../../src/logic/it-6-3-1";

describe("査定判定ロジック適用履歴と根拠記録 - 学習データ修正範囲決定", () => {
  // SCEN-1414: [edge] 学習データ修正範囲決定機能 - 修正対象範囲が全体の100%を超える場合、修正範囲が正規化される
  test("修正対象範囲の合計が100%を超える場合、各修正範囲が比例的に正規化されて合計が100%になること", () => {
    // 入力: 修正範囲A=60%、修正範囲B=50%（合計110%）
    const adjustmentRanges = [
      { rangeId: "A", targetPercentage: 60 },
      { rangeId: "B", targetPercentage: 50 },
    ];

    const result = normalizeAdjustmentRanges(adjustmentRanges);

    // 期待結果: 各範囲が正規化される
    // 正規化係数 = 100 / 110 ≈ 0.909090909...
    // 範囲A正規化後 = 60 * (100/110) = 54.545454...% ≈ 54.55%
    // 範囲B正規化後 = 50 * (100/110) = 45.454545...% ≈ 45.45%
    // 合計 = 54.55 + 45.45 = 100.00%

    expect(result).toEqual([
      { rangeId: "A", normalizedPercentage: 54.545454545454545 },
      { rangeId: "B", normalizedPercentage: 45.454545454545455 },
    ]);

    // 合計が100%であることを検証
    const totalPercentage = result.reduce(
      (sum, range) => sum + range.normalizedPercentage,
      0
    );
    expect(totalPercentage).toBeCloseTo(100, 10);

    // 相対比率が維持されていることを検証（A:B = 60:50 = 1.2:1）
    const ratioBeforeNormalization = 60 / 50; // 1.2
    const ratioAfterNormalization =
      result[0].normalizedPercentage / result[1].normalizedPercentage;
    expect(ratioAfterNormalization).toBeCloseTo(ratioBeforeNormalization, 10);
  });
});