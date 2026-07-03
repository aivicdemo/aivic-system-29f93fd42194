import { validateMonthlySummaryReport } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  test("SCEN-1009: 月次サマリーレポート正確性・完全性確認 - 生成されたレポートに必須項目が欠落している場合に修正指示が正確に実行される", () => {
    // テストデータ: 必須項目が欠落した月次サマリーレポート
    const incompleteReport = {
      reportId: "MSR-20240131-001",
      month: "2024-01",
      totalRevenue: 1500000,
      // 欠落: totalCount
      totalCustomers: 45,
      // 欠落: regionalBreakdown
      generatedAt: "2024-01-31T15:30:00Z",
      generatedBy: "operator_001",
    };

    const requiredFields = [
      "totalRevenue",
      "totalCount",
      "totalCustomers",
      "regionalBreakdown",
    ];

    // 欠落項目を検出
    const validationResult = validateMonthlySummaryReport(
      incompleteReport,
      requiredFields
    );

    // 欠落項目が正確に検出されることを確認
    expect(validationResult.isValid).toBe(false);
    expect(validationResult.missingFields).toEqual(["totalCount", "regionalBreakdown"]);
    expect(validationResult.missingFields.length).toBe(2);

    // 修正指示メッセージが生成されることを確認
    expect(validationResult.correctionInstructions).toBeDefined();
    expect(validationResult.correctionInstructions.length).toBeGreaterThan(0);

    // 修正指示が具体的であることを確認
    const correctionMessages = validationResult.correctionInstructions;
    expect(correctionMessages).toContain(expect.stringContaining("totalCount"));
    expect(correctionMessages).toContain(expect.stringContaining("regionalBreakdown"));

    // 修正指示に基づいてデータを補完したレポート
    const completedReport = {
      reportId: "MSR-20240131-001",
      month: "2024-01",
      totalRevenue: 1500000,
      totalCount: 87,
      totalCustomers: 45,
      regionalBreakdown: {
        tokyo: 450000,
        osaka: 380000,
        aichi: 320000,
        other: 350000,
      },
      generatedAt: "2024-01-31T15:30:00Z",
      generatedBy: "operator_001",
    };

    // 補完後のレポートを再検証
    const revalidationResult = validateMonthlySummaryReport(
      completedReport,
      requiredFields
    );

    // すべての必須項目が完全に含まれていることを確認
    expect(revalidationResult.isValid).toBe(true);
    expect(revalidationResult.missingFields).toEqual([]);
    expect(revalidationResult.missingFields.length).toBe(0);

    // 修正前後の比較: 修正が正確に実行されたことを検証
    expect(completedReport.totalCount).toBe(87);
    expect(completedReport.regionalBreakdown).toEqual({
      tokyo: 450000,
      osaka: 380000,
      aichi: 320000,
      other: 350000,
    });

    // 修正後レポートの売上合計が地域別集計と整合していることを確認
    const regionalSum =
      completedReport.regionalBreakdown.tokyo +
      completedReport.regionalBreakdown.osaka +
      completedReport.regionalBreakdown.aichi +
      completedReport.regionalBreakdown.other;
    expect(regionalSum).toBe(1500000);
    expect(regionalSum).toBe(completedReport.totalRevenue);

    // 修正指示に基づいた補完が完全に実行されたことを確認
    expect(revalidationResult.correctionInstructions).toEqual([]);
  });
});