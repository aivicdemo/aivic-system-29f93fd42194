import { validateReportAccuracy } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  test("SCEN-1201: レポート数値正確性判定機能 - ソースデータとレポート値が許容誤差を超過する場合、合否判定が『誤り』で返される", () => {
    // テスト環境にソースデータを準備する
    const sourceDataAmount = 1000000; // 基準値: 1,000,000円
    const reportAmount = 1050000; // レポート値: 1,050,000円
    const tolerancePercentage = 2; // 許容誤差: 2%

    // レポート数値正確性判定機能を実行する
    const result = validateReportAccuracy({
      sourceAmount: sourceDataAmount,
      reportAmount: reportAmount,
      tolerancePercentage: tolerancePercentage,
    });

    // 合否判定結果を取得し、検証する
    // 誤差率計算: (1,050,000 - 1,000,000) / 1,000,000 * 100 = 5%
    // 5% > 2% (許容誤差) → 不合格、合否判定が『誤り』
    expect(result.status).toBe("error");
    expect(result.discrepancyRate).toBe(5);
    expect(result.isWithinTolerance).toBe(false);
    expect(result.message).toMatch(/許容範囲外/);
  });
});