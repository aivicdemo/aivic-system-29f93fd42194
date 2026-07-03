import { calculateAndAggregateInvoiceAmounts } from "../../src/logic/it-1-2-1";

describe("請求額自動計算・集計機能 - 複数サービスの混在データで顧客別請求額が正しく集計される", () => {
  test("SCEN-1144: 複数サービスが混在したデータセットにおいて、顧客別の請求額が各サービスの単価×数量の合計として正しく集計される", () => {
    // テストデータ: 複数顧客、複数サービスの請求対象データ
    const billingInputData = [
      // 顧客001: サービスA×2件
      {
        customer_id: "CUST-001",
        service_id: "SRV-A",
        service_name: "サービスA",
        unit_price: 1000,
        quantity: 5,
      },
      {
        customer_id: "CUST-001",
        service_id: "SRV-A",
        service_name: "サービスA",
        unit_price: 1000,
        quantity: 3,
      },
      // 顧客001: サービスB×1件
      {
        customer_id: "CUST-001",
        service_id: "SRV-B",
        service_name: "サービスB",
        unit_price: 2000,
        quantity: 2,
      },
      // 顧客001: サービスC×3件
      {
        customer_id: "CUST-001",
        service_id: "SRV-C",
        service_name: "サービスC",
        unit_price: 500,
        quantity: 4,
      },
      {
        customer_id: "CUST-001",
        service_id: "SRV-C",
        service_name: "サービスC",
        unit_price: 500,
        quantity: 6,
      },
      {
        customer_id: "CUST-001",
        service_id: "SRV-C",
        service_name: "サービスC",
        unit_price: 500,
        quantity: 2,
      },
      // 顧客002: サービスA×2件
      {
        customer_id: "CUST-002",
        service_id: "SRV-A",
        service_name: "サービスA",
        unit_price: 1000,
        quantity: 10,
      },
      {
        customer_id: "CUST-002",
        service_id: "SRV-A",
        service_name: "サービスA",
        unit_price: 1000,
        quantity: 5,
      },
      // 顧客002: サービスB×1件
      {
        customer_id: "CUST-002",
        service_id: "SRV-B",
        service_name: "サービスB",
        unit_price: 2000,
        quantity: 3,
      },
      // 顧客003: サービスC×1件
      {
        customer_id: "CUST-003",
        service_id: "SRV-C",
        service_name: "サービスC",
        unit_price: 500,
        quantity: 8,
      },
    ];

    // 関数実行
    const result = calculateAndAggregateInvoiceAmounts(billingInputData);

    // 顧客001の期待値計算
    // サービスA: (1000 × 5) + (1000 × 3) = 5000 + 3000 = 8000
    // サービスB: 2000 × 2 = 4000
    // サービスC: (500 × 4) + (500 × 6) + (500 × 2) = 2000 + 3000 + 1000 = 6000
    // 顧客001の合計: 8000 + 4000 + 6000 = 18000
    const cust001Total = 18000;
    const cust001ServiceBreakdown = {
      "SRV-A": 8000,
      "SRV-B": 4000,
      "SRV-C": 6000,
    };

    // 顧客002の期待値計算
    // サービスA: (1000 × 10) + (1000 × 5) = 10000 + 5000 = 15000
    // サービスB: 2000 × 3 = 6000
    // 顧客002の合計: 15000 + 6000 = 21000
    const cust002Total = 21000;
    const cust002ServiceBreakdown = {
      "SRV-A": 15000,
      "SRV-B": 6000,
    };

    // 顧客003の期待値計算
    // サービスC: 500 × 8 = 4000
    const cust003Total = 4000;
    const cust003ServiceBreakdown = {
      "SRV-C": 4000,
    };

    // 結果検証: 顧客別の集計結果が存在すること
    expect(result).toBeDefined();
    expect(result.customer_aggregations).toBeDefined();
    expect(Array.isArray(result.customer_aggregations)).toBe(true);

    // 顧客数が3であること
    expect(result.customer_aggregations.length).toBe(3);

    // 顧客001の検証
    const cust001Result = result.customer_aggregations.find(
      (agg: any) => agg.customer_id === "CUST-001"
    );
    expect(cust001Result).toBeDefined();
    expect(cust001Result.total_invoice_amount).toBe(cust001Total);
    expect(cust001Result.service_breakdown).toEqual(cust001ServiceBreakdown);
    expect(Object.keys(cust001Result.service_breakdown).length).toBe(3);

    // 顧客002の検証
    const cust002Result = result.customer_aggregations.find(
      (agg: any) => agg.customer_id === "CUST-002"
    );
    expect(cust002Result).toBeDefined();
    expect(cust002Result.total_invoice_amount).toBe(cust002Total);
    expect(cust002Result.service_breakdown).toEqual(cust002ServiceBreakdown);
    expect(Object.keys(cust002Result.service_breakdown).length).toBe(2);

    // 顧客003の検証
    const cust003Result = result.customer_aggregations.find(
      (agg: any) => agg.customer_id === "CUST-003"
    );
    expect(cust003Result).toBeDefined();
    expect(cust003Result.total_invoice_amount).toBe(cust003Total);
    expect(cust003Result.service_breakdown).toEqual(cust003ServiceBreakdown);
    expect(Object.keys(cust003Result.service_breakdown).length).toBe(1);

    // 全体の合計請求額検証
    const grandTotal = cust001Total + cust002Total + cust003Total;
    expect(result.total_all_customers).toBe(grandTotal);
    expect(result.total_all_customers).toBe(43000);

    // サービス別集計の検証
    expect(result.service_aggregations).toBeDefined();
    expect(result.service_aggregations["SRV-A"]).toBe(
      cust001ServiceBreakdown["SRV-A"] + cust002ServiceBreakdown["SRV-A"]
    );
    expect(result.service_aggregations["SRV-A"]).toBe(23000);
    expect(result.service_aggregations["SRV-B"]).toBe(
      cust001ServiceBreakdown["SRV-B"] + cust002ServiceBreakdown["SRV-B"]
    );
    expect(result.service_aggregations["SRV-B"]).toBe(10000);
    expect(result.service_aggregations["SRV-C"]).toBe(
      cust001ServiceBreakdown["SRV-C"] + cust003ServiceBreakdown["SRV-C"]
    );
    expect(result.service_aggregations["SRV-C"]).toBe(10000);

    // 顧客別内訳の整合性検証
    for (const custAgg of result.customer_aggregations) {
      let calculatedTotal = 0;
      for (const serviceAmount of Object.values(
        custAgg.service_breakdown
      ) as number[]) {
        calculatedTotal += serviceAmount;
      }
      expect(custAgg.total_invoice_amount).toBe(calculatedTotal);
    }
  });
});