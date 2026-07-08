import { generateMonthlyAnalysisReport } from "../../src/logic/it-1-br-2-2-2-1";

describe("月次分析レポート自動生成・検証機能", () => {
  // SCEN-1058
  test("月次査定件数が1件のみの場合でもレポートが正常生成される", () => {
    // テスト用の月次査定データ: 対象月に査定件数1件のみ
    const targetYear = 2024;
    const targetMonth = 3;
    const assessmentRecords = [
      {
        recordId: "REC-001",
        assessorId: "ASSESSOR-101",
        assessmentDate: "2024-03-15",
        quotationAmount: 1500000,
        assessmentTime: 45,
        priceDeviation: 2.5,
        deviationAmount: 37500,
        status: "approved",
      },
    ];

    // レポート生成実行
    const report = generateMonthlyAnalysisReport({
      year: targetYear,
      month: targetMonth,
      records: assessmentRecords,
      generatedAt: new Date("2024-03-31T18:00:00Z"),
    });

    // ================== ヘッダー情報の検証 ==================
    expect(report.header).toBeDefined();
    expect(report.header.title).toBe("月次分析レポート");
    expect(report.header.targetMonth).toBe("2024年3月");
    expect(report.header.generatedDate).toBe("2024-03-31");

    // ================== レポート生成日時の検証 ==================
    expect(report.generatedDatetime).toBe("2024-03-31T18:00:00Z");

    // ================== 対象月の検証 ==================
    expect(report.period.year).toBe(2024);
    expect(report.period.month).toBe(3);

    // ================== 査定件数（1件）の検証 ==================
    expect(report.statistics.totalAssessmentCount).toBe(1);

    // ================== 統計情報の正確性検証 ==================
    // 単一件数時の統計値の正確さを検証
    expect(report.statistics.averageAssessmentTime).toBe(45);
    expect(report.statistics.totalAssessmentTime).toBe(45);
    expect(report.statistics.averagePriceDeviation).toBe(2.5);
    expect(report.statistics.totalQuotationAmount).toBe(1500000);
    expect(report.statistics.totalDeviationAmount).toBe(37500);

    // ================== グラフ・チャートの検証 ==================
    expect(report.charts).toBeDefined();
    expect(report.charts.length).toBeGreaterThan(0);
    expect(report.charts[0].type).toBe("assessmentTimeTrend");
    expect(report.charts[0].dataPoints).toBeDefined();
    expect(report.charts[0].dataPoints.length).toBe(1);
    expect(report.charts[0].dataPoints[0].value).toBe(45);

    // ================== デバイエーション分布チャートの検証 ==================
    const deviationChart = report.charts.find(
      (c) => c.type === "priceDeviationDistribution"
    );
    expect(deviationChart).toBeDefined();
    expect(deviationChart!.dataPoints.length).toBe(1);

    // ================== フッター情報の検証 ==================
    expect(report.footer).toBeDefined();
    expect(report.footer.pageCount).toBe(1);
    expect(report.footer.generatedSystem).toBe("査定品質管理・標準化システム");

    // ================== レポートのフォーマット整合性検証 ==================
    expect(report.format).toBe("html");
    expect(report.formatValidation.isValid).toBe(true);
    expect(report.formatValidation.missingFields.length).toBe(0);
    expect(report.formatValidation.corruptedSections.length).toBe(0);

    // ================== 数値計算の正確性確認 ==================
    // 平均値の計算
    const expectedAverageDeviation = 2.5;
    expect(report.statistics.averagePriceDeviation).toBe(
      expectedAverageDeviation
    );

    // 合計値の計算
    const expectedTotalDeviation = 37500;
    expect(report.statistics.totalDeviationAmount).toBe(expectedTotalDeviation);

    // ================== エラー状態の検証 ==================
    expect(report.errors).toBeDefined();
    expect(report.errors.length).toBe(0);
    expect(report.consoleErrors).toBeDefined();
    expect(report.consoleErrors.length).toBe(0);

    // ================== レポート完全性の検証 ==================
    expect(report.completionStatus).toBe("success");
    expect(report.isFullyGenerated).toBe(true);

    // ================== 本番環境レンディング用プロパティ ==================
    expect(report.html).toBeDefined();
    expect(report.html.length).toBeGreaterThan(0);
    expect(report.html).toContain("月次分析レポート");
    expect(report.html).toContain("2024年3月");
    expect(report.html).toContain("1");
  });
});