import { generateSalesReportAggregationManual } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業報告書集計標準手順書生成機能", () => {
  // SCEN-1055
  test("営業データの集計対象項目・集計単位・データソース・計算式が正しく一覧化される", () => {
    // Arrange
    const input = {
      dataSourceSelection: ["営業実績DB", "顧客情報DB"],
      aggregationItems: [
        { itemName: "売上金額", dataType: "decimal" },
        { itemName: "件数", dataType: "integer" },
        { itemName: "顧客数", dataType: "integer" },
      ],
      aggregationUnit: ["月次", "部門別", "営業担当者別"],
      calculationFormulas: [
        { itemName: "売上金額", formula: "合計" },
        { itemName: "件数", formula: "カウント" },
        { itemName: "顧客数", formula: "去重カウント" },
      ],
    };

    // Act
    const result = generateSalesReportAggregationManual(input);

    // Assert
    expect(result).toEqual({
      status: "success",
      manual: {
        dataSourceList: [
          { order: 1, sourceName: "営業実績DB" },
          { order: 2, sourceName: "顧客情報DB" },
        ],
        aggregationItemList: [
          {
            order: 1,
            itemName: "売上金額",
            dataType: "decimal",
            dataSource: "営業実績DB",
            calculationFormula: "合計",
            aggregationUnits: ["月次", "部門別", "営業担当者別"],
          },
          {
            order: 2,
            itemName: "件数",
            dataType: "integer",
            dataSource: "営業実績DB",
            calculationFormula: "カウント",
            aggregationUnits: ["月次", "部門別", "営業担当者別"],
          },
          {
            order: 3,
            itemName: "顧客数",
            dataType: "integer",
            dataSource: "顧客情報DB",
            calculationFormula: "去重カウント",
            aggregationUnits: ["月次", "部門別", "営業担当者別"],
          },
        ],
        summary: {
          totalDataSources: 2,
          totalAggregationItems: 3,
          totalAggregationUnits: 3,
          generatedAt: "2024-01-15T09:00:00Z",
        },
      },
    });

    // 生成結果の確認
    expect(result.manual.dataSourceList.length).toBe(2);
    expect(result.manual.aggregationItemList.length).toBe(3);
    expect(result.manual.aggregationItemList[0].itemName).toBe("売上金額");
    expect(result.manual.aggregationItemList[0].calculationFormula).toBe("合計");
    expect(result.manual.aggregationItemList[0].aggregationUnits).toEqual([
      "月次",
      "部門別",
      "営業担当者別",
    ]);
    expect(result.manual.aggregationItemList[1].itemName).toBe("件数");
    expect(result.manual.aggregationItemList[1].calculationFormula).toBe(
      "カウント"
    );
    expect(result.manual.aggregationItemList[2].itemName).toBe("顧客数");
    expect(result.manual.aggregationItemList[2].calculationFormula).toBe(
      "去重カウント"
    );
    expect(result.manual.aggregationItemList[2].dataSource).toBe("顧客情報DB");
  });
});