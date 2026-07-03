import { verifyReportDataAccuracy } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証", () => {
  // SCEN-1171: [edge] レポート数値とソースデータの照合機能 - 許容誤差を超える数値差分を不一致として検出
  test("許容誤差を超える数値差分を不一致として検出できる", () => {
    const source_amount = 1000000;
    const report_amount = 1005100;
    const tolerance_threshold = 5000;

    const result = verifyReportDataAccuracy({
      source_amount,
      report_amount,
      tolerance_threshold,
    });

    expect(result.is_mismatch).toBe(true);
    expect(result.difference).toBe(5100);
    expect(result.exceeds_tolerance).toBe(true);
    expect(result.error_message).toMatch(/差分/);
  });
});