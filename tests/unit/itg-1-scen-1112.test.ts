import { aggregateCustomerPerformanceMetrics } from "../../src/logic/it-1781935279444-1-1-1";

describe("顧客別成果指標集計ロジック検証", () => {
  test("SCEN-1112: アポ数がゼロの場合でも集計ロジックが正常に実行される", () => {
    // テストデータ: アポ数が0の顧客レコード複数件
    const testDataWithZeroAppointments = [
      {
        customerId: "CUST_001",
        customerName: "顧客A",
        serviceType: "SERVICE_BASIC",
        appointmentCount: 0,
        contractedCount: 0,
        salesAmount: 0,
        customerSatisfactionScore: 0,
        month: "2024-01",
      },
      {
        customerId: "CUST_002",
        customerName: "顧客B",
        serviceType: "SERVICE_PREMIUM",
        appointmentCount: 0,
        contractedCount: 2,
        salesAmount: 150000,
        customerSatisfactionScore: 85,
        month: "2024-01",
      },
      {
        customerId: "CUST_003",
        customerName: "顧客C",
        serviceType: "SERVICE_STANDARD",
        appointmentCount: 0,
        contractedCount: 5,
        salesAmount: 300000,
        customerSatisfactionScore: 92,
        month: "2024-01",
      },
    ];

    // 集計ロジックを実行
    const result = aggregateCustomerPerformanceMetrics(testDataWithZeroAppointments);

    // 集計結果のオブジェクト構造が期待通りであることを検証
    expect(result).toBeDefined();
    expect(result).toHaveProperty("aggregationTimestamp");
    expect(result).toHaveProperty("aggregatedMetrics");
    expect(Array.isArray(result.aggregatedMetrics)).toBe(true);

    // 集計結果の個数が入力と一致することを検証
    expect(result.aggregatedMetrics).toHaveLength(3);

    // アポ数=0の場合、他の指標値が正しく計算されていることを検証
    const metric1 = result.aggregatedMetrics.find((m: any) => m.customerId === "CUST_001");
    expect(metric1).toBeDefined();
    expect(metric1.appointmentCount).toBe(0);
    expect(metric1.contractedCount).toBe(0);
    expect(metric1.salesAmount).toBe(0);
    expect(metric1.customerSatisfactionScore).toBe(0);
    expect(metric1.aggregatedTotal).toBe(0);
    expect(typeof metric1.aggregatedTotal).toBe("number");

    // 顧客Bの指標検証: アポ数0でも他の指標が集計される
    const metric2 = result.aggregatedMetrics.find((m: any) => m.customerId === "CUST_002");
    expect(metric2).toBeDefined();
    expect(metric2.appointmentCount).toBe(0);
    expect(metric2.contractedCount).toBe(2);
    expect(metric2.salesAmount).toBe(150000);
    expect(metric2.customerSatisfactionScore).toBe(85);
    // 計算式: (契約数 * 50000) + (売上金額) + (満足度スコア * 100) = (2*50000) + 150000 + (85*100) = 100000 + 150000 + 8500 = 258500
    expect(metric2.aggregatedTotal).toBe(258500);

    // 顧客Cの指標検証: アポ数0でも複数の指標が正しく集計される
    const metric3 = result.aggregatedMetrics.find((m: any) => m.customerId === "CUST_003");
    expect(metric3).toBeDefined();
    expect(metric3.appointmentCount).toBe(0);
    expect(metric3.contractedCount).toBe(5);
    expect(metric3.salesAmount).toBe(300000);
    expect(metric3.customerSatisfactionScore).toBe(92);
    // 計算式: (契約数 * 50000) + (売上金額) + (満足度スコア * 100) = (5*50000) + 300000 + (92*100) = 250000 + 300000 + 9200 = 559200
    expect(metric3.aggregatedTotal).toBe(559200);

    // すべての集計結果に必須フィールドが存在することを検証
    result.aggregatedMetrics.forEach((metric: any) => {
      expect(metric).toHaveProperty("customerId");
      expect(metric).toHaveProperty("customerName");
      expect(metric).toHaveProperty("serviceType");
      expect(metric).toHaveProperty("appointmentCount");
      expect(metric).toHaveProperty("contractedCount");
      expect(metric).toHaveProperty("salesAmount");
      expect(metric).toHaveProperty("customerSatisfactionScore");
      expect(metric).toHaveProperty("aggregatedTotal");
      expect(metric).toHaveProperty("month");
    });

    // ゼロ除算エラーがないことを検証: aggregatedTotalは数値型で有限値
    result.aggregatedMetrics.forEach((metric: any) => {
      expect(typeof metric.aggregatedTotal).toBe("number");
      expect(isFinite(metric.aggregatedTotal)).toBe(true);
      expect(isNaN(metric.aggregatedTotal)).toBe(false);
    });

    // 集計処理時刻がISO8601形式で記録されていることを検証
    expect(typeof result.aggregationTimestamp).toBe("string");
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(result.aggregationTimestamp)).toBe(true);

    // 処理結果にエラーログが含まれていないことを検証
    expect(result).toHaveProperty("errorLog");
    expect(Array.isArray(result.errorLog)).toBe(true);
    expect(result.errorLog).toHaveLength(0);

    // 処理ステータスが成功（success）であることを確認
    expect(result).toHaveProperty("status");
    expect(result.status).toBe("success");

    // 集計結果がデータベースに正常に保存されたことを示すIDが割り当てられていることを検証
    expect(result).toHaveProperty("aggregationId");
    expect(typeof result.aggregationId).toBe("string");
    expect(result.aggregationId.length).toBeGreaterThan(0);
  });
});