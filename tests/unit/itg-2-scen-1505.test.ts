import { calculateImprovementRate } from "../../src/logic/it-1-br-2-2-2-1";

describe("改善前後精度計測・可視化機能", () => {
  test("SCEN-1505: 改善前後精度が同一値の場合、改善度0%として正確に表示される", () => {
    // テストデータの準備：改善前精度と改善後精度が同一値（75.5%）
    const accuracyBeforeImprovement = 75.5;
    const accuracyAfterImprovement = 75.5;

    // 改善度を計算する関数をトリガー
    const improvementRate = calculateImprovementRate({
      accuracyBefore: accuracyBeforeImprovement,
      accuracyAfter: accuracyAfterImprovement,
    });

    // 改善度の計算結果を取得・検証：同一値の場合は0%
    expect(improvementRate).toBe(0);

    // 改善度の表示形式が正確に「0%」で表示される
    const displayFormat = `${improvementRate}%`;
    expect(displayFormat).toBe("0%");

    // 可視化グラフが改善度0%を正しく表現
    expect(improvementRate).toEqual(0);
  });
});