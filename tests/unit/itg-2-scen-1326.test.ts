import { extractROIReportWithPartialData } from "../../src/logic/it-6-2-1-1";

describe("ROI実績レポート自動抽出 - 部分的欠損データ処理", () => {
  // SCEN-1326
  test("月次集計データが部分的に欠損している場合、補完可能な指標のみを抽出し、不足分を警告表示する", () => {
    const partial_monthly_data = {
      operating_profit: 5000000,
      revenue: 50000000,
      customer_acquisition_cost: null,
      customer_lifetime_value: null,
      period: "2024-01",
    };

    const result = extractROIReportWithPartialData(partial_monthly_data);

    expect(result.extracted_indicators).toEqual({
      operating_profit_margin: 10,
      revenue_growth_rate: 0,
    });

    expect(result.extracted_indicators.operating_profit_margin).toBe(10);

    expect(result.warnings).toHaveLength(2);
    expect(result.warnings[0]).toMatch(/顧客獲得コスト/);
    expect(result.warnings[1]).toMatch(/顧客生涯価値/);

    expect(result.missing_items).toContain("customer_acquisition_cost");
    expect(result.missing_items).toContain("customer_lifetime_value");

    expect(result.unextracted_indicators).toContain("ROI");
    expect(result.unextracted_indicators).toContain("顧客生涯価値単価");

    expect(result.report_export).toHaveProperty("complemented_data");
    expect(result.report_export).toHaveProperty("warning_info");
    expect(result.report_export.complemented_data).toEqual({
      operating_profit: 5000000,
      revenue: 50000000,
      operating_profit_margin: 10,
    });

    expect(result.report_export.warning_info).toEqual({
      missing_count: 2,
      missing_fields: [
        "customer_acquisition_cost",
        "customer_lifetime_value",
      ],
      unextracted_indicators: ["ROI", "顧客生涯価値単価"],
      message:
        "顧客獲得コスト、顧客生涯価値のデータが不足しています。ROI、顧客生涯価値単価の指標抽出ができません。",
    });

    expect(result.is_complete_report).toBe(false);
    expect(result.is_partial_report).toBe(true);
  });
});