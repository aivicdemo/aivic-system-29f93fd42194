import { generateExplanationDocument } from "../../src/logic/it-1-br-2-2-2-1";

describe("説明資料の自動生成機能", () => {
  // SCEN-1011: [normal] 説明資料の自動生成機能 - 相場乖離の数値・グラフ・根拠がテンプレートに正確に自動挿入される
  test("相場乖離の数値・グラフ・根拠がテンプレートに正確に自動挿入される", () => {
    const input_case_1 = {
      assessmentCaseId: "CASE-2024-001",
      estimateAmount: 1000000,
      marketAmount: 950000,
      deviationRate: 5.26,
      deviationAmount: 50000,
      referenceDataCount: 12,
      commodityCondition: "良好",
      marketTrend: "上昇傾向",
      supplyDemandBalance: "需要過多",
      chartType: "bar_chart",
      chartDataPoints: [
        { label: "見積金額", value: 1000000 },
        { label: "市場相場", value: 950000 },
      ],
      templateFormat: "standard",
    };

    const result_case_1 = generateExplanationDocument(input_case_1);

    expect(result_case_1).toBeDefined();
    expect(result_case_1.documentId).toBeDefined();
    expect(result_case_1.documentId.length).toBeGreaterThan(0);
    expect(result_case_1.content).toContain("1000000");
    expect(result_case_1.content).toContain("950000");
    expect(result_case_1.content).toContain("5.26");
    expect(result_case_1.content).toContain("50000");
    expect(result_case_1.content).toContain("12");
    expect(result_case_1.content).toContain("良好");
    expect(result_case_1.content).toContain("上昇傾向");
    expect(result_case_1.content).toContain("需要過多");
    expect(result_case_1.graphInsertionPoint).toBeDefined();
    expect(result_case_1.graphType).toBe("bar_chart");
    expect(result_case_1.chartData).toHaveLength(2);
    expect(result_case_1.chartData[0]).toEqual({
      label: "見積金額",
      value: 1000000,
    });
    expect(result_case_1.chartData[1]).toEqual({
      label: "市場相場",
      value: 950000,
    });
    expect(result_case_1.layoutValid).toBe(true);
    expect(result_case_1.insertionErrors).toHaveLength(0);
    expect(result_case_1.format).toBe("pdf");

    const input_case_2 = {
      assessmentCaseId: "CASE-2024-002",
      estimateAmount: 500000,
      marketAmount: 480000,
      deviationRate: 4.17,
      deviationAmount: 20000,
      referenceDataCount: 8,
      commodityCondition: "標準",
      marketTrend: "横ばい",
      supplyDemandBalance: "均衡",
      chartType: "line_chart",
      chartDataPoints: [
        { label: "見積金額", value: 500000 },
        { label: "市場相場", value: 480000 },
      ],
      templateFormat: "standard",
    };

    const result_case_2 = generateExplanationDocument(input_case_2);

    expect(result_case_2).toBeDefined();
    expect(result_case_2.documentId).toBeDefined();
    expect(result_case_2.documentId).not.toBe(result_case_1.documentId);
    expect(result_case_2.content).toContain("500000");
    expect(result_case_2.content).toContain("480000");
    expect(result_case_2.content).toContain("4.17");
    expect(result_case_2.content).toContain("20000");
    expect(result_case_2.content).toContain("8");
    expect(result_case_2.content).toContain("標準");
    expect(result_case_2.content).toContain("横ばい");
    expect(result_case_2.content).toContain("均衡");
    expect(result_case_2.graphInsertionPoint).toBeDefined();
    expect(result_case_2.graphType).toBe("line_chart");
    expect(result_case_2.chartData).toHaveLength(2);
    expect(result_case_2.chartData[0]).toEqual({
      label: "見積金額",
      value: 500000,
    });
    expect(result_case_2.chartData[1]).toEqual({
      label: "市場相場",
      value: 480000,
    });
    expect(result_case_2.layoutValid).toBe(true);
    expect(result_case_2.insertionErrors).toHaveLength(0);
    expect(result_case_2.format).toBe("pdf");

    const input_case_3 = {
      assessmentCaseId: "CASE-2024-003",
      estimateAmount: 2000000,
      marketAmount: 1900000,
      deviationRate: 5.26,
      deviationAmount: 100000,
      referenceDataCount: 15,
      commodityCondition: "優良",
      marketTrend: "下降傾向",
      supplyDemandBalance: "供給過剰",
      chartType: "bar_chart",
      chartDataPoints: [
        { label: "見積金額", value: 2000000 },
        { label: "市場相場", value: 1900000 },
      ],
      templateFormat: "standard",
    };

    const result_case_3 = generateExplanationDocument(input_case_3);

    expect(result_case_3).toBeDefined();
    expect(result_case_3.documentId).toBeDefined();
    expect(result_case_3.documentId).not.toBe(result_case_1.documentId);
    expect(result_case_3.documentId).not.toBe(result_case_2.documentId);
    expect(result_case_3.content).toContain("2000000");
    expect(result_case_3.content).toContain("1900000");
    expect(result_case_3.content).toContain("5.26");
    expect(result_case_3.content).toContain("100000");
    expect(result_case_3.content).toContain("15");
    expect(result_case_3.content).toContain("優良");
    expect(result_case_3.content).toContain("下降傾向");
    expect(result_case_3.content).toContain("供給過剰");
    expect(result_case_3.graphInsertionPoint).toBeDefined();
    expect(result_case_3.graphType).toBe("bar_chart");
    expect(result_case_3.chartData).toHaveLength(2);
    expect(result_case_3.chartData[0]).toEqual({
      label: "見積金額",
      value: 2000000,
    });
    expect(result_case_3.chartData[1]).toEqual({
      label: "市場相場",
      value: 1900000,
    });
    expect(result_case_3.layoutValid).toBe(true);
    expect(result_case_3.insertionErrors).toHaveLength(0);
    expect(result_case_3.format).toBe("pdf");

    expect([
      result_case_1.layoutValid,
      result_case_2.layoutValid,
      result_case_3.layoutValid,
    ]).toEqual([true, true, true]);

    expect([
      result_case_1.insertionErrors.length,
      result_case_2.insertionErrors.length,
      result_case_3.insertionErrors.length,
    ]).toEqual([0, 0, 0]);
  });
});