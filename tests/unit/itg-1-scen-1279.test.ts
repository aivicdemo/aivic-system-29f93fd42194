import { extractBillingItemsAndAggregateByCustomerService } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-1279: [edge] 請求対象項目の自動抽出・顧客別サービス別請求額集計 - 請求対象金額が 0 円となる場合、集計結果として正確に反映される
  test("請求対象金額が0円の項目が集計結果に正確に反映され、0円として記録される。また、顧客別・サービス別の集計においても0円の項目が除外されず、合計請求額の計算に正確に含まれる", () => {
    // テストデータ: 複数の顧客別・サービス別の請求レコード、うち複数件が0円
    const sales_data = [
      {
        customer_id: "CUST_001",
        service_id: "SVC_A",
        appointment_count: 5,
        contract_count: 2,
        unit_price: 10000,
      },
      {
        customer_id: "CUST_001",
        service_id: "SVC_B",
        appointment_count: 0,
        contract_count: 0,
        unit_price: 5000,
      },
      {
        customer_id: "CUST_002",
        service_id: "SVC_A",
        appointment_count: 3,
        contract_count: 1,
        unit_price: 10000,
      },
      {
        customer_id: "CUST_002",
        service_id: "SVC_C",
        appointment_count: 0,
        contract_count: 0,
        unit_price: 8000,
      },
      {
        customer_id: "CUST_003",
        service_id: "SVC_B",
        appointment_count: 2,
        contract_count: 0,
        unit_price: 5000,
      },
    ];

    const billing_rules = {
      CUST_001: {
        SVC_A: { base_charge: 0, per_appointment: 10000, per_contract: 0 },
        SVC_B: { base_charge: 0, per_appointment: 5000, per_contract: 0 },
      },
      CUST_002: {
        SVC_A: { base_charge: 0, per_appointment: 10000, per_contract: 0 },
        SVC_C: { base_charge: 0, per_appointment: 8000, per_contract: 0 },
      },
      CUST_003: {
        SVC_B: { base_charge: 0, per_appointment: 5000, per_contract: 0 },
      },
    };

    // 営業データ品質管理・請求自動化システムの請求対象項目自動抽出機能を実行
    const result = extractBillingItemsAndAggregateByCustomerService(
      sales_data,
      billing_rules
    );

    // 抽出された請求対象項目に対して、顧客別サービス別請求額集計処理の結果を検証

    // 集計結果のデータを確認し、0円の請求対象項目が集計対象に含まれていることを検証
    expect(result).toHaveProperty("billing_items");
    expect(Array.isArray(result.billing_items)).toBe(true);

    const zero_yen_items = result.billing_items.filter(
      (item: any) => item.billing_amount === 0
    );
    expect(zero_yen_items.length).toBeGreaterThan(0);

    // 集計結果において、0円の請求対象項目の金額が正確に0円として記録されていることを確認
    zero_yen_items.forEach((item: any) => {
      expect(item.billing_amount).toBe(0);
      expect(typeof item.customer_id).toBe("string");
      expect(typeof item.service_id).toBe("string");
    });

    // 0円の請求対象項目を含む顧客の合計請求額が正確に計算されていることを検証
    expect(result).toHaveProperty("aggregated_by_customer_service");
    const aggregated = result.aggregated_by_customer_service;

    // CUST_001 の請求額検証: SVC_A: 50000(5*10000), SVC_B: 0(0*5000) = 合計50000
    const cust_001_aggregate = aggregated.find(
      (agg: any) => agg.customer_id === "CUST_001"
    );
    expect(cust_001_aggregate).toBeDefined();
    expect(cust_001_aggregate.total_billing_amount).toBe(50000);
    expect(cust_001_aggregate.services).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          service_id: "SVC_A",
          service_billing_amount: 50000,
        }),
        expect.objectContaining({
          service_id: "SVC_B",
          service_billing_amount: 0,
        }),
      ])
    );

    // CUST_002 の請求額検証: SVC_A: 30000(3*10000), SVC_C: 0(0*8000) = 合計30000
    const cust_002_aggregate = aggregated.find(
      (agg: any) => agg.customer_id === "CUST_002"
    );
    expect(cust_002_aggregate).toBeDefined();
    expect(cust_002_aggregate.total_billing_amount).toBe(30000);
    expect(cust_002_aggregate.services).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          service_id: "SVC_A",
          service_billing_amount: 30000,
        }),
        expect.objectContaining({
          service_id: "SVC_C",
          service_billing_amount: 0,
        }),
      ])
    );

    // CUST_003 の請求額検証: SVC_B: 10000(2*5000) = 合計10000
    const cust_003_aggregate = aggregated.find(
      (agg: any) => agg.customer_id === "CUST_003"
    );
    expect(cust_003_aggregate).toBeDefined();
    expect(cust_003_aggregate.total_billing_amount).toBe(10000);
    expect(cust_003_aggregate.services).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          service_id: "SVC_B",
          service_billing_amount: 10000,
        }),
      ])
    );

    // 集計結果のJSON形式のレスポンスを確認し、0円のデータが適切に含まれていることを確認
    expect(typeof result).toBe("object");
    expect(result).toHaveProperty("billing_items");
    expect(result).toHaveProperty("aggregated_by_customer_service");
    expect(result).toHaveProperty("total_aggregated_amount");

    // 全体の合計請求額を検証: 50000 + 30000 + 10000 = 90000
    expect(result.total_aggregated_amount).toBe(90000);

    // 0円の項目が JSON に適切に含まれていることを確認
    const json_str = JSON.stringify(result);
    expect(json_str).toContain('"billing_amount":0');
    expect(json_str).toContain('"service_billing_amount":0');
  });
});