import {
  validateSalesDataAgainstMetadata,
  extractBillableItems,
  generateReportFromMapping,
  applyCalculationLogic,
} from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ項目メタデータ管理 - データ検証・請求対象抽出・レポート生成", () => {
  test("SCEN-619: メタデータ定義に基づくデータ検証・請求抽出・レポート生成が正しく実行される", () => {
    // メタデータ定義
    const metadata = {
      items: [
        {
          id: "apo_count",
          name: "アポ数",
          unit: "件",
          dataType: "number",
          required: true,
          minValue: 0,
          maxValue: 1000,
          calculationLogic: "sum",
          reportMapping: "monthlyAppointments",
        },
        {
          id: "contract_count",
          name: "成約数",
          unit: "件",
          dataType: "number",
          required: true,
          minValue: 0,
          maxValue: 500,
          calculationLogic: "sum",
          reportMapping: "monthlyContracts",
        },
        {
          id: "customer_satisfaction",
          name: "顧客満足度",
          unit: "%",
          dataType: "number",
          required: false,
          minValue: 0,
          maxValue: 100,
          calculationLogic: "average",
          reportMapping: "satisfactionScore",
        },
        {
          id: "revenue_amount",
          name: "売上金額",
          unit: "円",
          dataType: "number",
          required: true,
          minValue: 0,
          maxValue: 10000000,
          calculationLogic: "sum",
          reportMapping: "totalRevenue",
        },
      ],
    };

    // テスト用営業データ
    const salesData = {
      period: "2024-01",
      customer_id: "CUST001",
      service_id: "SVC_SALES",
      apo_count: 25,
      contract_count: 8,
      customer_satisfaction: 92,
      revenue_amount: 450000,
    };

    // ①データ検証が正しく実行される
    const validationResult = validateSalesDataAgainstMetadata(
      salesData,
      metadata
    );
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.errors).toEqual([]);
    expect(validationResult.warnings).toEqual([]);

    // ②請求対象抽出が正確に実行される
    const billableItemsConfig = {
      billable_fields: ["contract_count", "revenue_amount"],
      exclusions: [],
    };
    const extractedItems = extractBillableItems(
      salesData,
      billableItemsConfig,
      metadata
    );
    expect(extractedItems.contract_count).toBe(8);
    expect(extractedItems.revenue_amount).toBe(450000);
    expect(extractedItems.apo_count).toBeUndefined();

    // ③レポートマッピングに従ったレポートが正しく生成される
    const reportMapping = {
      monthlyAppointments: "apo_count",
      monthlyContracts: "contract_count",
      satisfactionScore: "customer_satisfaction",
      totalRevenue: "revenue_amount",
    };
    const report = generateReportFromMapping(salesData, reportMapping, metadata);
    expect(report.monthlyAppointments).toBe(25);
    expect(report.monthlyContracts).toBe(8);
    expect(report.satisfactionScore).toBe(92);
    expect(report.totalRevenue).toBe(450000);

    // ④計算ロジックが適用され、期待通りの値が算出される
    const multipleRecords = [
      { apo_count: 10, contract_count: 3, revenue_amount: 200000 },
      { apo_count: 15, contract_count: 5, revenue_amount: 250000 },
    ];
    const calculatedResult = applyCalculationLogic(
      multipleRecords,
      metadata.items
    );
    expect(calculatedResult.apo_count_sum).toBe(25);
    expect(calculatedResult.contract_count_sum).toBe(8);
    expect(calculatedResult.revenue_amount_sum).toBe(450000);

    // ⑤全体のプロセスがエラーなく完了する
    expect(validationResult.isValid).toBe(true);
    expect(extractedItems).toBeDefined();
    expect(report).toBeDefined();
    expect(calculatedResult).toBeDefined();
  });
});