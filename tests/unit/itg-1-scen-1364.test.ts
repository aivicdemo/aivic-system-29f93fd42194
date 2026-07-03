import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  generateMonthlySummary,
  validateSummaryCalculations,
  applyTemplateOrdering,
} from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレート定義・管理機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1364
  test("月次サマリーテンプレート項目の計算ロジックが正確に適用され、表示順序が制御される", () => {
    // テンプレート定義: 売上合計、件数、平均値
    const template = {
      templateId: "tpl_001",
      templateName: "標準月次サマリー",
      items: [
        {
          itemId: "item_001",
          itemName: "売上合計",
          calculation: "sum",
          dataField: "revenue",
          displayOrder: 1,
          unit: "円",
        },
        {
          itemId: "item_002",
          itemName: "成約件数",
          calculation: "count",
          dataField: "dealCount",
          displayOrder: 2,
          unit: "件",
        },
        {
          itemId: "item_003",
          itemName: "平均単価",
          calculation: "average",
          dataField: "revenue",
          displayOrder: 3,
          unit: "円",
        },
      ],
    };

    // テストデータ: 前月の営業データ
    const salesData = [
      {
        id: "deal_001",
        customerId: "cust_001",
        revenue: 100000,
        dealCount: 1,
        date: "2024-01-15",
      },
      {
        id: "deal_002",
        customerId: "cust_002",
        revenue: 150000,
        dealCount: 1,
        date: "2024-01-20",
      },
      {
        id: "deal_003",
        customerId: "cust_001",
        revenue: 200000,
        dealCount: 1,
        date: "2024-01-25",
      },
    ];

    // 月次サマリー生成処理を実行
    const generatedSummary = generateMonthlySummary({
      templateId: template.templateId,
      salesData: salesData,
      period: "2024-01",
    });

    // 計算値の検証
    // 売上合計: 100000 + 150000 + 200000 = 450000
    expect(generatedSummary.calculations.totalRevenue).toBe(450000);

    // 成約件数: 3件
    expect(generatedSummary.calculations.dealCount).toBe(3);

    // 平均単価: 450000 / 3 = 150000
    expect(generatedSummary.calculations.averagePrice).toBe(150000);

    // テンプレートの計算ロジックが正確に適用されていることを検証
    const validationResult = validateSummaryCalculations({
      summary: generatedSummary,
      template: template,
      sourceData: salesData,
    });

    expect(validationResult.isValid).toBe(true);
    expect(validationResult.errorMessages).toEqual([]);

    // 表示順序がテンプレート設定通りに制御されていることを検証
    const orderedSummary = applyTemplateOrdering({
      summary: generatedSummary,
      template: template,
    });

    expect(orderedSummary.orderedItems).toHaveLength(3);
    expect(orderedSummary.orderedItems[0].displayOrder).toBe(1);
    expect(orderedSummary.orderedItems[0].itemName).toBe("売上合計");
    expect(orderedSummary.orderedItems[1].displayOrder).toBe(2);
    expect(orderedSummary.orderedItems[1].itemName).toBe("成約件数");
    expect(orderedSummary.orderedItems[2].displayOrder).toBe(3);
    expect(orderedSummary.orderedItems[2].itemName).toBe("平均単価");

    // 複数パターンのテンプレート設定で再度検証
    const alternativeTemplate = {
      templateId: "tpl_002",
      templateName: "カスタム月次サマリー",
      items: [
        {
          itemId: "item_003",
          itemName: "平均単価",
          calculation: "average",
          dataField: "revenue",
          displayOrder: 1,
          unit: "円",
        },
        {
          itemId: "item_002",
          itemName: "成約件数",
          calculation: "count",
          dataField: "dealCount",
          displayOrder: 2,
          unit: "件",
        },
        {
          itemId: "item_001",
          itemName: "売上合計",
          calculation: "sum",
          dataField: "revenue",
          displayOrder: 3,
          unit: "円",
        },
      ],
    };

    const altOrderedSummary = applyTemplateOrdering({
      summary: generatedSummary,
      template: alternativeTemplate,
    });

    expect(altOrderedSummary.orderedItems).toHaveLength(3);
    expect(altOrderedSummary.orderedItems[0].itemName).toBe("平均単価");
    expect(altOrderedSummary.orderedItems[1].itemName).toBe("成約件数");
    expect(altOrderedSummary.orderedItems[2].itemName).toBe("売上合計");

    // エクスポート機能でサマリーを出力し、計算値と表示順序が維持されていることを確認
    const exportedData = {
      templateId: template.templateId,
      period: "2024-01",
      calculations: {
        totalRevenue: 450000,
        dealCount: 3,
        averagePrice: 150000,
      },
      items: orderedSummary.orderedItems,
      exportedAt: "2024-02-01T09:00:00Z",
    };

    expect(exportedData.calculations.totalRevenue).toBe(450000);
    expect(exportedData.calculations.dealCount).toBe(3);
    expect(exportedData.calculations.averagePrice).toBe(150000);
    expect(exportedData.items[0].itemName).toBe("売上合計");
    expect(exportedData.items[1].itemName).toBe("成約件数");
    expect(exportedData.items[2].itemName).toBe("平均単価");

    // エクスポート後のテンプレート設定変更時も計算値が一貫性を持つか確認
    const revalidatedSummary = validateSummaryCalculations({
      summary: generatedSummary,
      template: alternativeTemplate,
      sourceData: salesData,
    });

    expect(revalidatedSummary.isValid).toBe(true);
    expect(revalidatedSummary.errorMessages).toEqual([]);

    // 計算精度の確認: 境界値テスト
    const edgeCaseSalesData = [
      { id: "edge_001", revenue: 0, dealCount: 0, date: "2024-01-01" },
      { id: "edge_002", revenue: 999999999, dealCount: 1, date: "2024-01-02" },
    ];

    const edgeCaseSummary = generateMonthlySummary({
      templateId: template.templateId,
      salesData: edgeCaseSalesData,
      period: "2024-01",
    });

    expect(edgeCaseSummary.calculations.totalRevenue).toBe(999999999);
    expect(edgeCaseSummary.calculations.dealCount).toBe(1);
    expect(edgeCaseSummary.calculations.averagePrice).toBe(999999999);

    // データなしのケース
    const emptySalesData = [];

    const emptySummary = generateMonthlySummary({
      templateId: template.templateId,
      salesData: emptySalesData,
      period: "2024-01",
    });

    expect(emptySummary.calculations.totalRevenue).toBe(0);
    expect(emptySummary.calculations.dealCount).toBe(0);
    expect(emptySummary.calculations.averagePrice).toBe(0);
  });
});