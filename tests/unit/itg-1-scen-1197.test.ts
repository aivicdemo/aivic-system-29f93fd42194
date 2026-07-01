import { validateReportDataConsistency } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  test("SCEN-1197: レポート数値とソースデータ照合機能 - 不一致フラグと差分が返される", () => {
    // Arrange: テストデータ準備
    const sourceData = {
      salesAmount: 100000,
      period: "2024-01",
      customerId: "CUST001",
      serviceId: "SVC001",
    };

    const reportData = {
      salesAmount: 120000,
      period: "2024-01",
      customerId: "CUST001",
      serviceId: "SVC001",
    };

    // Act: レポート数値とソースデータ照合機能を実行
    const result = validateReportDataConsistency(sourceData, reportData);

    // Assert: 照合結果を検証
    // 不一致フラグがtrueであること
    expect(result.mismatchFlag).toBe(true);

    // 差分が20,000円（120,000 - 100,000）として返されること
    expect(result.difference).toBe(20000);

    // ソース値が100,000円であること
    expect(result.sourceValue).toBe(100000);

    // レポート値が120,000円であること
    expect(result.reportValue).toBe(120000);

    // 照合結果オブジェクトに必要なプロパティがすべて含まれることを検証
    expect(result).toEqual({
      mismatchFlag: true,
      difference: 20000,
      sourceValue: 100000,
      reportValue: 120000,
    });

    // 差分の計算方法が正しい（レポート値 - ソース値）ことを検証
    expect(result.difference).toBe(result.reportValue - result.sourceValue);
  });
});