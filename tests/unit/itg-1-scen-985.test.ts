import { calculateBillingAmountByCustomerAndService } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-985
  test("顧客ごと・サービスごとの請求額が正確に集計される", () => {
    const testData = {
      customers: [
        {
          customer_id: "CUST_A",
          customer_name: "顧客A",
          contract_services: [
            {
              service_id: "SVC_1",
              service_name: "サービス1",
              unit_price: 10000,
              usage_count: 3,
            },
            {
              service_id: "SVC_2",
              service_name: "サービス2",
              unit_price: 5000,
              usage_count: 2,
            },
          ],
        },
        {
          customer_id: "CUST_B",
          customer_name: "顧客B",
          contract_services: [
            {
              service_id: "SVC_1",
              service_name: "サービス1",
              unit_price: 10000,
              usage_count: 2,
            },
            {
              service_id: "SVC_2",
              service_name: "サービス2",
              unit_price: 5000,
              usage_count: 4,
            },
          ],
        },
      ],
    };

    const result = calculateBillingAmountByCustomerAndService(testData);

    // 顧客Aのサービス1請求額: 10000 × 3 = 30000
    // 顧客Aのサービス2請求額: 5000 × 2 = 10000
    // 顧客Aの合計請求額: 30000 + 10000 = 40000
    expect(result.customers[0].customer_id).toBe("CUST_A");
    expect(result.customers[0].customer_name).toBe("顧客A");
    expect(result.customers[0].service_breakdown).toEqual([
      {
        service_id: "SVC_1",
        service_name: "サービス1",
        billing_amount: 30000,
      },
      {
        service_id: "SVC_2",
        service_name: "サービス2",
        billing_amount: 10000,
      },
    ]);
    expect(result.customers[0].total_billing_amount).toBe(40000);

    // 顧客Bのサービス1請求額: 10000 × 2 = 20000
    // 顧客Bのサービス2請求額: 5000 × 4 = 20000
    // 顧客Bの合計請求額: 20000 + 20000 = 40000
    expect(result.customers[1].customer_id).toBe("CUST_B");
    expect(result.customers[1].customer_name).toBe("顧客B");
    expect(result.customers[1].service_breakdown).toEqual([
      {
        service_id: "SVC_1",
        service_name: "サービス1",
        billing_amount: 20000,
      },
      {
        service_id: "SVC_2",
        service_name: "サービス2",
        billing_amount: 20000,
      },
    ]);
    expect(result.customers[1].total_billing_amount).toBe(40000);

    // 全顧客の合計請求額: 40000 + 40000 = 80000
    expect(result.grand_total_billing_amount).toBe(80000);

    // サービス別集計の確認
    // サービス1全体: 30000 + 20000 = 50000
    // サービス2全体: 10000 + 20000 = 30000
    expect(result.service_summary).toEqual([
      {
        service_id: "SVC_1",
        service_name: "サービス1",
        total_billing_amount: 50000,
      },
      {
        service_id: "SVC_2",
        service_name: "サービス2",
        total_billing_amount: 30000,
      },
    ]);
  });
});