import { describe, it, expect, beforeEach } from "@jest/globals";
import { calculateBillingAmount } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-601: [normal] 請求額計算機能 - 契約書定義の単価・割引ルールに基づき顧客ごと・サービスごとの請求額が正確に計算される
  it("複数の契約書定義と顧客ごと・サービスごとの利用実績から正確な請求額を計算し、割引ルールが適切に適用される", () => {
    // 契約書定義：顧客A
    const contractA = {
      contract_id: "CONTRACT_A",
      customer_id: "CUST_A",
      service_id: "SVC_001",
      base_price: 5000,
      discount_rule_id: "DISCOUNT_5PERCENT",
      discount_rate: 0.05,
      priority: 1,
    };

    // 契約書定義：顧客A・サービス2
    const contractA2 = {
      contract_id: "CONTRACT_A2",
      customer_id: "CUST_A",
      service_id: "SVC_002",
      base_price: 3000,
      discount_rule_id: null,
      discount_rate: 0,
      priority: 1,
    };

    // 契約書定義：顧客B
    const contractB = {
      contract_id: "CONTRACT_B",
      customer_id: "CUST_B",
      service_id: "SVC_001",
      base_price: 5000,
      discount_rule_id: "DISCOUNT_10PERCENT",
      discount_rate: 0.1,
      priority: 1,
    };

    // 顧客マスタ
    const customerA = {
      customer_id: "CUST_A",
      customer_name: "Customer A",
      status: "active",
    };

    const customerB = {
      customer_id: "CUST_B",
      customer_name: "Customer B",
      status: "active",
    };

    // サービスマスタ
    const service1 = {
      service_id: "SVC_001",
      service_name: "Service 1",
      unit: "hours",
    };

    const service2 = {
      service_id: "SVC_002",
      service_name: "Service 2",
      unit: "units",
    };

    // 利用実績データ：顧客A・サービス1（基本単価5,000円、数量10、5%割引ルール適用）
    const usageA1 = {
      customer_id: "CUST_A",
      service_id: "SVC_001",
      quantity: 10,
      contract_id: "CONTRACT_A",
    };

    // 利用実績データ：顧客A・サービス2（基本単価3,000円、数量5、割引なし）
    const usageA2 = {
      customer_id: "CUST_A",
      service_id: "SVC_002",
      quantity: 5,
      contract_id: "CONTRACT_A2",
    };

    // 利用実績データ：顧客B・サービス1（基本単価5,000円、数量20、10%割引ルール適用）
    const usageB1 = {
      customer_id: "CUST_B",
      service_id: "SVC_001",
      quantity: 20,
      contract_id: "CONTRACT_B",
    };

    const input = {
      contracts: [contractA, contractA2, contractB],
      customers: [customerA, customerB],
      services: [service1, service2],
      usages: [usageA1, usageA2, usageB1],
    };

    const result = calculateBillingAmount(input);

    // 顧客Aの請求額を確認：
    // サービス1: 5,000 × 10 × (1 - 0.05) = 5,000 × 10 × 0.95 = 47,500円
    // サービス2: 3,000 × 5 × (1 - 0) = 3,000 × 5 = 15,000円
    // 合計: 47,500 + 15,000 = 62,500円
    expect(result.customer_billing).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          customer_id: "CUST_A",
          total_amount: 62500,
          service_breakdown: expect.arrayContaining([
            expect.objectContaining({
              service_id: "SVC_001",
              service_name: "Service 1",
              quantity: 10,
              base_price: 5000,
              discount_rate: 0.05,
              subtotal: 47500,
            }),
            expect.objectContaining({
              service_id: "SVC_002",
              service_name: "Service 2",
              quantity: 5,
              base_price: 3000,
              discount_rate: 0,
              subtotal: 15000,
            }),
          ]),
        }),
      ])
    );

    // 顧客Bの請求額を確認：
    // サービス1: 5,000 × 20 × (1 - 0.1) = 5,000 × 20 × 0.9 = 90,000円
    // 合計: 90,000円
    expect(result.customer_billing).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          customer_id: "CUST_B",
          total_amount: 90000,
          service_breakdown: expect.arrayContaining([
            expect.objectContaining({
              service_id: "SVC_001",
              service_name: "Service 1",
              quantity: 20,
              base_price: 5000,
              discount_rate: 0.1,
              subtotal: 90000,
            }),
          ]),
        }),
      ])
    );

    // 全体検証：2件の顧客請求データが生成されていることを確認
    expect(result.customer_billing).toHaveLength(2);

    // 割引ルールの優先順位が正しく適用されていることを確認
    const customerAServiceBreakdown = result.customer_billing.find(
      (b: any) => b.customer_id === "CUST_A"
    )?.service_breakdown;
    const service1Billing = customerAServiceBreakdown?.find(
      (sb: any) => sb.service_id === "SVC_001"
    );
    expect(service1Billing?.discount_rate).toBe(0.05);

    const customerBServiceBreakdown = result.customer_billing.find(
      (b: any) => b.customer_id === "CUST_B"
    )?.service_breakdown;
    const customerBService1Billing = customerBServiceBreakdown?.find(
      (sb: any) => sb.service_id === "SVC_001"
    );
    expect(customerBService1Billing?.discount_rate).toBe(0.1);

    // 請求内訳の正確性を確認：各サービスの内訳が正確に表示されていることを検証
    expect(result.total_revenue).toBe(152500);
  });
});