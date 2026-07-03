import { aggregateCustomerServiceBilling } from "../../src/logic/it-1-2-1";

describe("顧客別・サービス別請求額集計機能", () => {
  // SCEN-1301
  test("複数のサービスを利用する顧客の場合、サービスごと・顧客ごとに請求額が正確に集計される", () => {
    // Arrange: テストデータ準備
    const billing_records = [
      {
        customer_id: "CUST_A",
        customer_name: "顧客A",
        service_id: "SVC_A",
        service_name: "ServiceA",
        amount: 100000,
      },
      {
        customer_id: "CUST_A",
        customer_name: "顧客A",
        service_id: "SVC_B",
        service_name: "ServiceB",
        amount: 50000,
      },
      {
        customer_id: "CUST_A",
        customer_name: "顧客A",
        service_id: "SVC_C",
        service_name: "ServiceC",
        amount: 75000,
      },
      {
        customer_id: "CUST_B",
        customer_name: "顧客B",
        service_id: "SVC_A",
        service_name: "ServiceA",
        amount: 80000,
      },
      {
        customer_id: "CUST_B",
        customer_name: "顧客B",
        service_id: "SVC_B",
        service_name: "ServiceB",
        amount: 60000,
      },
    ];

    // Act: 顧客別・サービス別請求額集計機能を実行
    const result = aggregateCustomerServiceBilling(billing_records);

    // Assert: 顧客Aの集計結果を検証
    const customer_a = result.customer_billing.find(
      (c) => c.customer_id === "CUST_A"
    );
    expect(customer_a).toBeDefined();
    expect(customer_a?.customer_name).toBe("顧客A");
    expect(customer_a?.total_amount).toBe(225000);

    // 顧客Aのサービスごと請求額を検証
    expect(customer_a?.service_breakdown).toHaveLength(3);
    const customer_a_service_a = customer_a?.service_breakdown.find(
      (s) => s.service_id === "SVC_A"
    );
    expect(customer_a_service_a?.service_name).toBe("ServiceA");
    expect(customer_a_service_a?.amount).toBe(100000);

    const customer_a_service_b = customer_a?.service_breakdown.find(
      (s) => s.service_id === "SVC_B"
    );
    expect(customer_a_service_b?.service_name).toBe("ServiceB");
    expect(customer_a_service_b?.amount).toBe(50000);

    const customer_a_service_c = customer_a?.service_breakdown.find(
      (s) => s.service_id === "SVC_C"
    );
    expect(customer_a_service_c?.service_name).toBe("ServiceC");
    expect(customer_a_service_c?.amount).toBe(75000);

    // Assert: 顧客Bの集計結果を検証
    const customer_b = result.customer_billing.find(
      (c) => c.customer_id === "CUST_B"
    );
    expect(customer_b).toBeDefined();
    expect(customer_b?.customer_name).toBe("顧客B");
    expect(customer_b?.total_amount).toBe(140000);

    // 顧客Bのサービスごと請求額を検証
    expect(customer_b?.service_breakdown).toHaveLength(2);
    const customer_b_service_a = customer_b?.service_breakdown.find(
      (s) => s.service_id === "SVC_A"
    );
    expect(customer_b_service_a?.service_name).toBe("ServiceA");
    expect(customer_b_service_a?.amount).toBe(80000);

    const customer_b_service_b = customer_b?.service_breakdown.find(
      (s) => s.service_id === "SVC_B"
    );
    expect(customer_b_service_b?.service_name).toBe("ServiceB");
    expect(customer_b_service_b?.amount).toBe(60000);

    // Assert: サービス別集計結果を検証
    expect(result.service_billing).toHaveLength(3);

    const service_a_total = result.service_billing.find(
      (s) => s.service_id === "SVC_A"
    );
    expect(service_a_total?.service_name).toBe("ServiceA");
    expect(service_a_total?.total_amount).toBe(180000);
    expect(service_a_total?.customer_count).toBe(2);

    const service_b_total = result.service_billing.find(
      (s) => s.service_id === "SVC_B"
    );
    expect(service_b_total?.service_name).toBe("ServiceB");
    expect(service_b_total?.total_amount).toBe(110000);
    expect(service_b_total?.customer_count).toBe(2);

    const service_c_total = result.service_billing.find(
      (s) => s.service_id === "SVC_C"
    );
    expect(service_c_total?.service_name).toBe("ServiceC");
    expect(service_c_total?.total_amount).toBe(75000);
    expect(service_c_total?.customer_count).toBe(1);

    // Assert: 全体の整合性を検証（重複や漏れがないことを確認）
    const total_sum_from_customer = result.customer_billing.reduce(
      (sum, c) => sum + c.total_amount,
      0
    );
    expect(total_sum_from_customer).toBe(365000);

    const total_sum_from_service = result.service_billing.reduce(
      (sum, s) => sum + s.total_amount,
      0
    );
    expect(total_sum_from_service).toBe(365000);

    expect(result.customer_billing).toHaveLength(2);
  });
});