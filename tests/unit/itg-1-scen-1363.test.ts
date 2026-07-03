import {
  generateMonthlySummary,
} from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレート定義・管理機能", () => {
  // SCEN-1363
  test("月次サマリーテンプレート定義に基づき、営業データ検証結果と請求集計結果が正確にサマリー化される", () => {
    const templateId = "tpl_202501";
    const templateName = "標準月次サマリーテンプレート";
    const templateItems = [
      {
        itemId: "item_sales_total",
        itemLabel: "売上合計",
        itemOrder: 1,
        calculationLogic: "SUM",
        format: "currency",
      },
      {
        itemId: "item_commission",
        itemLabel: "手数料",
        itemOrder: 2,
        calculationLogic: "RATE",
        format: "currency",
      },
      {
        itemId: "item_tax",
        itemLabel: "税金",
        itemOrder: 3,
        calculationLogic: "RATE",
        format: "currency",
      },
      {
        itemId: "item_validation_count",
        itemLabel: "検証済み件数",
        itemOrder: 4,
        calculationLogic: "COUNT",
        format: "number",
      },
      {
        itemId: "item_validation_error_count",
        itemLabel: "検証エラー件数",
        itemOrder: 5,
        calculationLogic: "COUNT",
        format: "number",
      },
      {
        itemId: "item_validation_warning_count",
        itemLabel: "検証警告件数",
        itemOrder: 6,
        calculationLogic: "COUNT",
        format: "number",
      },
    ];

    const validationResults = {
      totalCount: 150,
      errorCount: 5,
      warningCount: 12,
      successCount: 133,
      successRate: 0.8867,
    };

    const billingAggregation = {
      totalSales: 5000000,
      commissionRate: 0.03,
      commissionAmount: 150000,
      taxRate: 0.1,
      taxAmount: 15000,
      netAmount: 4835000,
    };

    const summaryPeriod = {
      startDate: "2025-01-01",
      endDate: "2025-01-31",
      monthYear: "2025-01",
    };

    const input = {
      templateId,
      templateName,
      templateItems,
      validationResults,
      billingAggregation,
      summaryPeriod,
    };

    const result = generateMonthlySummary(input);

    expect(result).toBeDefined();
    expect(result.templateId).toBe("tpl_202501");
    expect(result.templateName).toBe("標準月次サマリーテンプレート");
    expect(result.period).toEqual({
      startDate: "2025-01-01",
      endDate: "2025-01-31",
      monthYear: "2025-01",
    });

    expect(result.summaryData).toBeDefined();
    expect(Array.isArray(result.summaryData)).toBe(true);
    expect(result.summaryData.length).toBe(6);

    const salesTotalItem = result.summaryData.find(
      (item: any) => item.itemId === "item_sales_total"
    );
    expect(salesTotalItem).toBeDefined();
    expect(salesTotalItem.value).toBe(5000000);
    expect(salesTotalItem.label).toBe("売上合計");
    expect(salesTotalItem.order).toBe(1);

    const commissionItem = result.summaryData.find(
      (item: any) => item.itemId === "item_commission"
    );
    expect(commissionItem).toBeDefined();
    expect(commissionItem.value).toBe(150000);
    expect(commissionItem.label).toBe("手数料");
    expect(commissionItem.order).toBe(2);

    const taxItem = result.summaryData.find(
      (item: any) => item.itemId === "item_tax"
    );
    expect(taxItem).toBeDefined();
    expect(taxItem.value).toBe(15000);
    expect(taxItem.label).toBe("税金");
    expect(taxItem.order).toBe(3);

    const validationCountItem = result.summaryData.find(
      (item: any) => item.itemId === "item_validation_count"
    );
    expect(validationCountItem).toBeDefined();
    expect(validationCountItem.value).toBe(150);
    expect(validationCountItem.label).toBe("検証済み件数");

    const errorCountItem = result.summaryData.find(
      (item: any) => item.itemId === "item_validation_error_count"
    );
    expect(errorCountItem).toBeDefined();
    expect(errorCountItem.value).toBe(5);
    expect(errorCountItem.label).toBe("検証エラー件数");

    const warningCountItem = result.summaryData.find(
      (item: any) => item.itemId === "item_validation_warning_count"
    );
    expect(warningCountItem).toBeDefined();
    expect(warningCountItem.value).toBe(12);
    expect(warningCountItem.label).toBe("検証警告件数");

    expect(result.validationMetrics).toBeDefined();
    expect(result.validationMetrics.totalCount).toBe(150);
    expect(result.validationMetrics.errorCount).toBe(5);
    expect(result.validationMetrics.warningCount).toBe(12);
    expect(result.validationMetrics.successCount).toBe(133);
    expect(result.validationMetrics.successRate).toBeCloseTo(0.8867, 4);

    expect(result.billingMetrics).toBeDefined();
    expect(result.billingMetrics.totalSales).toBe(5000000);
    expect(result.billingMetrics.commissionAmount).toBe(150000);
    expect(result.billingMetrics.taxAmount).toBe(15000);
    expect(result.billingMetrics.netAmount).toBe(4835000);

    expect(result.generatedAt).toBeDefined();
    expect(typeof result.generatedAt).toBe("string");

    expect(result.status).toBe("generated");
    expect(result.isSaved).toBe(true);
  });
});