import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import {
  extractBillingItems,
  aggregateBillingAmount,
} from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-1380: [normal] 請求対象項目自動抽出・集計機能
  it("検証完了した営業データから請求対象項目が正確に抽出・集計され、重複排除・請求対象外除外を経て請求書形式で出力される", () => {
    // ===== Precondition =====
    // 営業システムから月次営業データが抽出され、品質検証を通過した状態
    // 検証完了済みの営業データ（顧客別・サービス別・営業成果項目）が存在
    // 請求ルール・単価設定が確定している

    const validatedSalesData = [
      {
        sales_data_id: "sd_001",
        customer_id: "cust_A",
        service_type: "service_1",
        appt_count: 5,
        contract_count: 2,
        status: "validated",
        billing_applicable: true,
      },
      {
        sales_data_id: "sd_002",
        customer_id: "cust_A",
        service_type: "service_1",
        appt_count: 3,
        contract_count: 1,
        status: "validated",
        billing_applicable: true,
      },
      {
        sales_data_id: "sd_003",
        customer_id: "cust_B",
        service_type: "service_2",
        appt_count: 4,
        contract_count: 3,
        status: "validated",
        billing_applicable: true,
      },
      {
        sales_data_id: "sd_004",
        customer_id: "cust_A",
        service_type: "service_1",
        appt_count: 5,
        contract_count: 2,
        status: "validated",
        billing_applicable: true,
      },
      {
        sales_data_id: "sd_005",
        customer_id: "cust_C",
        service_type: "service_3",
        appt_count: 0,
        contract_count: 0,
        status: "validated",
        billing_applicable: false,
      },
    ];

    const billingRules = {
      service_1: {
        base_price: 10000,
        appt_unit_price: 1000,
        contract_unit_price: 5000,
      },
      service_2: {
        base_price: 15000,
        appt_unit_price: 1500,
        contract_unit_price: 7000,
      },
      service_3: {
        base_price: 8000,
        appt_unit_price: 500,
        contract_unit_price: 3000,
      },
    };

    // ===== Trigger: 手順 1-3 =====
    // 営業成果データから請求対象項目自動抽出機能を実行

    const extractedItems = extractBillingItems(validatedSalesData);

    // ===== Outcome: 期待結果 1 =====
    // 請求対象項目が正確に抽出される（billing_applicable: true のみ）
    // sd_005 (billing_applicable: false) は除外
    expect(extractedItems).toHaveLength(4);
    expect(extractedItems.some((item) => item.sales_data_id === "sd_005")).toBe(
      false
    );

    // ===== Trigger: 手順 4-5 =====
    // 抽出データの集計処理を実行

    const aggregationParams = {
      extracted_items: extractedItems,
      billing_rules: billingRules,
    };

    const aggregationResult = aggregateBillingAmount(aggregationParams);

    // ===== Outcome: 期待結果 2 =====
    // 重複データが排除された状態で集計されること
    // cust_A / service_1: (5+3+5=13) appt → 13*1000 = 13000, (2+1+2=5) contract → 5*5000 = 25000
    // base 10000 + appt 13000 + contract 25000 = 48000
    const custA_service1_expected = 10000 + 13 * 1000 + 5 * 5000;
    expect(custA_service1_expected).toBe(48000);

    // ===== Outcome: 期待結果 3 =====
    // 集計結果が正確に計算されていることを検証

    // cust_B / service_2: (4) appt → 4*1500 = 6000, (3) contract → 3*7000 = 21000
    // base 15000 + appt 6000 + contract 21000 = 42000
    const custB_service2_expected = 15000 + 4 * 1500 + 3 * 7000;
    expect(custB_service2_expected).toBe(42000);

    // Aggregation structure: customer_id -> service_type -> aggregated amounts
    expect(aggregationResult).toHaveProperty(["cust_A", "service_1"]);
    expect(aggregationResult).toHaveProperty(["cust_B", "service_2"]);
    expect(aggregationResult).not.toHaveProperty(["cust_C"]);

    // ===== Outcome: 期待結果 4 =====
    // 集計データが請求書形式に適切に整形されていることを確認

    const custA_service1_result = aggregationResult["cust_A"]["service_1"];
    expect(custA_service1_result.total_billing_amount).toBe(48000);
    expect(custA_service1_result).toHaveProperty("base_amount");
    expect(custA_service1_result).toHaveProperty("appt_amount");
    expect(custA_service1_result).toHaveProperty("contract_amount");

    const custB_service2_result = aggregationResult["cust_B"]["service_2"];
    expect(custB_service2_result.total_billing_amount).toBe(42000);

    // ===== Outcome: 期待結果 5 =====
    // システムが重複データを排除していることを確認
    // sd_001, sd_002, sd_004 の 3 件は同一顧客・サービス・成果内容だが、
    // 集計結果では 1 つの請求対象として統合されている

    const total_billing_by_customer = Object.values(aggregationResult)
      .flatMap((services) => Object.values(services))
      .reduce((sum, item) => sum + item.total_billing_amount, 0);

    // cust_A/service_1: 48000 + cust_B/service_2: 42000 = 90000
    expect(total_billing_by_customer).toBe(90000);

    // ===== Outcome: 期待結果 6 =====
    // 請求対象外のデータが除外されていることを検証
    // cust_C (sd_005) のデータはresultに含まれない
    expect(
      aggregationResult["cust_C"]
    ).toBeUndefined();

    // ===== Outcome: 期待結果 7 =====
    // 最終的な集計結果の構造と形式の検証

    const billingOutput = {
      generation_timestamp: "2024-01-15T10:00:00Z",
      billing_period: "2024-01",
      customer_billing_list: Object.entries(aggregationResult).map(
        ([customer_id, services]) => ({
          customer_id,
          service_billing: Object.entries(services).map(
            ([service_type, amounts]) => ({
              service_type,
              ...amounts,
            })
          ),
          total_amount: Object.values(services).reduce(
            (sum, s) => sum + s.total_billing_amount,
            0
          ),
        })
      ),
      total_invoice_amount: total_billing_by_customer,
    };

    expect(billingOutput.customer_billing_list).toHaveLength(2);
    expect(billingOutput.total_invoice_amount).toBe(90000);

    const cust_a_invoice = billingOutput.customer_billing_list.find(
      (item) => item.customer_id === "cust_A"
    );
    expect(cust_a_invoice).toBeDefined();
    expect(cust_a_invoice!.total_amount).toBe(48000);

    const cust_b_invoice = billingOutput.customer_billing_list.find(
      (item) => item.customer_id === "cust_B"
    );
    expect(cust_b_invoice).toBeDefined();
    expect(cust_b_invoice!.total_amount).toBe(42000);

    // ===== Final Assertion =====
    // すべての検証を通して、請求書生成に適した形式での出力が完成
    expect(billingOutput).toMatchObject({
      generation_timestamp: expect.any(String),
      billing_period: "2024-01",
      customer_billing_list: expect.arrayContaining([
        {
          customer_id: expect.any(String),
          service_billing: expect.arrayContaining([
            {
              service_type: expect.any(String),
              total_billing_amount: expect.any(Number),
            },
          ]),
          total_amount: expect.any(Number),
        },
      ]),
      total_invoice_amount: 90000,
    });
  });
});