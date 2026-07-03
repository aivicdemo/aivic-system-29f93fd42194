import {
  validateGeneratedReport,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-1124: [normal] 生成レポートの自動品質検証 - レポート内の全項目が期待値の範囲内にあり、完全性・正確性が確認される
  test("should validate generated report and confirm completeness and accuracy of all items within expected ranges", () => {
    const generatedReport = {
      reportId: "RPT-2024-01-001",
      generatedAt: "2024-01-31T23:59:59Z",
      targetPeriodStart: "2024-01-01T00:00:00Z",
      targetPeriodEnd: "2024-01-31T23:59:59Z",
      items: [
        {
          itemName: "アポ数",
          dataType: "number",
          value: 45,
          expectedMinValue: 0,
          expectedMaxValue: 1000,
          isRequired: true,
        },
        {
          itemName: "成約数",
          dataType: "number",
          value: 12,
          expectedMinValue: 0,
          expectedMaxValue: 500,
          isRequired: true,
        },
        {
          itemName: "成約率",
          dataType: "number",
          value: 0.2667,
          expectedMinValue: 0,
          expectedMaxValue: 1,
          isRequired: true,
        },
        {
          itemName: "顧客反応スコア",
          dataType: "number",
          value: 8.5,
          expectedMinValue: 0,
          expectedMaxValue: 10,
          isRequired: true,
        },
        {
          itemName: "請求対象額",
          dataType: "number",
          value: 250000,
          expectedMinValue: 0,
          expectedMaxValue: 10000000,
          isRequired: true,
        },
        {
          itemName: "レポートステータス",
          dataType: "string",
          value: "確定",
          expectedValues: ["確定", "仮確定", "保留"],
          isRequired: true,
        },
      ],
      calculations: [
        {
          formulaName: "成約率計算",
          formula: "成約数 / アポ数",
          calculatedValue: 0.2667,
          expectedValue: 0.2667,
          precision: 4,
        },
      ],
      hasNoContradictions: true,
      hasNoDuplicates: true,
      timestampAlignment: {
        generatedAtWithinPeriod: false,
        generatedAfterPeriodEnd: true,
      },
    };

    const validationResult = validateGeneratedReport(generatedReport);

    expect(validationResult.isValid).toBe(true);
    expect(validationResult.completenessCheck.allRequiredItemsPresent).toBe(
      true
    );
    expect(validationResult.completenessCheck.requiredItemsCount).toBe(6);
    expect(validationResult.completenessCheck.presentItemsCount).toBe(6);
    expect(validationResult.dataTypeValidation.allItemsHaveCorrectType).toBe(
      true
    );
    expect(validationResult.dataTypeValidation.invalidTypeCount).toBe(0);
    expect(validationResult.rangeValidation.allItemsWithinRange).toBe(true);
    expect(validationResult.rangeValidation.outOfRangeCount).toBe(0);
    expect(validationResult.rangeValidation.outOfRangeItems).toEqual([]);
    expect(validationResult.calculationValidation.allCalculationsAccurate).toBe(
      true
    );
    expect(validationResult.calculationValidation.inaccurateCalculations).toBe(0);
    expect(validationResult.calculationValidation.precisionErrors).toEqual([]);
    expect(validationResult.contradictionCheck.hasContradictions).toBe(false);
    expect(validationResult.contradictionCheck.contradictionDetails).toEqual(
      []
    );
    expect(validationResult.duplicationCheck.hasDuplicates).toBe(false);
    expect(validationResult.duplicationCheck.duplicateItems).toEqual([]);
    expect(validationResult.timestampValidation.isAligned).toBe(true);
    expect(validationResult.timestampValidation.generatedAt).toBe(
      "2024-01-31T23:59:59Z"
    );
    expect(validationResult.timestampValidation.periodStart).toBe(
      "2024-01-01T00:00:00Z"
    );
    expect(validationResult.timestampValidation.periodEnd).toBe(
      "2024-01-31T23:59:59Z"
    );
    expect(validationResult.timestampValidation.alignmentStatus).toBe(
      "生成日時は対象期間の終了後であり、月次レポートとして適切"
    );
    expect(validationResult.overallStatus).toBe("合格");
    expect(validationResult.validationMessage).toBe(
      "レポートのすべての項目が期待値の範囲内にあり、必須項目がすべて存在し、データ型が正確で、計算結果が正確であり、矛盾や重複がなく、タイムスタンプが整合しています。"
    );
  });
});