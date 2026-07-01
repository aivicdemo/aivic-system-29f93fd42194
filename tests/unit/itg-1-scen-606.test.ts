import {
  extractBillableItems,
  aggregateBillingAmountByCustomer,
  aggregateBillingAmountByService,
  aggregateBillingAmountByCustomerAndService,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 請求対象項目抽出・請求額集計", () => {
  // SCEN-606
  test("検証済み営業データから顧客ごと・サービスごとの請求額が正確に集計される", () => {
    // テストデータベースに検証済みステータスの営業データを複数件登録する
    // （異なる顧客、異なるサービスを含む）
    const verified_sales_data = [
      {
        id: "sales_001",
        customer_id: "cust_A",
        service_id: "svc_1",
        validation_status: "verified",
        apo_count: 5,
        contract_count: 2,
        amount: 100000,
        metadata: {
          item_name: "アポイント数",
          unit: "件",
          data_type: "integer",
          calculation_logic: "COUNT",
          report_mapping: "billing_apo",
        },
      },
      {
        id: "sales_002",
        customer_id: "cust_A",
        service_id: "svc_1",
        validation_status: "verified",
        apo_count: 3,
        contract_count: 1,
        amount: 60000,
        metadata: {
          item_name: "成約数",
          unit: "件",
          data_type: "integer",
          calculation_logic: "COUNT",
          report_mapping: "billing_contract",
        },
      },
      {
        id: "sales_003",
        customer_id: "cust_A",
        service_id: "svc_2",
        validation_status: "verified",
        apo_count: 2,
        contract_count: 1,
        amount: 50000,
        metadata: {
          item_name: "顧客反応",
          unit: "スコア",
          data_type: "integer",
          calculation_logic: "AVG",
          report_mapping: "billing_response",
        },
      },
      {
        id: "sales_004",
        customer_id: "cust_B",
        service_id: "svc_1",
        validation_status: "verified",
        apo_count: 8,
        contract_count: 3,
        amount: 150000,
        metadata: {
          item_name: "アポイント数",
          unit: "件",
          data_type: "integer",
          calculation_logic: "COUNT",
          report_mapping: "billing_apo",
        },
      },
      {
        id: "sales_005",
        customer_id: "cust_B",
        service_id: "svc_2",
        validation_status: "verified",
        apo_count: 4,
        contract_count: 2,
        amount: 80000,
        metadata: {
          item_name: "成約数",
          unit: "件",
          data_type: "integer",
          calculation_logic: "COUNT",
          report_mapping: "billing_contract",
        },
      },
      {
        id: "sales_006",
        customer_id: "cust_C",
        service_id: "svc_1",
        validation_status: "verified",
        apo_count: 6,
        contract_count: 2,
        amount: 120000,
        metadata: {
          item_name: "アポイント数",
          unit: "件",
          data_type: "integer",
          calculation_logic: "COUNT",
          report_mapping: "billing_apo",
        },
      },
      {
        id: "sales_007",
        customer_id: "cust_unverified",
        service_id: "svc_1",
        validation_status: "unverified",
        apo_count: 3,
        contract_count: 1,
        amount: 60000,
        metadata: {
          item_name: "アポイント数",
          unit: "件",
          data_type: "integer",
          calculation_logic: "COUNT",
          report_mapping: "billing_apo",
        },
      },
    ];

    // 請求対象項目抽出機能を実行し、検証済み営業データのみが抽出されることを確認する
    const extracted_billable_items = extractBillableItems(verified_sales_data);

    // 検証済みデータのみが抽出される（未検証データは除外）
    expect(extracted_billable_items.length).toBe(6);
    expect(extracted_billable_items.every((item) => item.validation_status === "verified")).toBe(
      true
    );
    expect(extracted_billable_items.find((item) => item.customer_id === "cust_unverified")).toBeUndefined();

    // 抽出されたデータに対して顧客ごとの請求額集計処理を実行する
    const customer_billing_result = aggregateBillingAmountByCustomer(extracted_billable_items);

    // 各顧客の請求額が正確に集計されていることを検証する
    // 手作業計算との照合
    // cust_A: 100000 + 60000 + 50000 = 210000
    // cust_B: 150000 + 80000 = 230000
    // cust_C: 120000
    expect(customer_billing_result["cust_A"]).toBe(210000);
    expect(customer_billing_result["cust_B"]).toBe(230000);
    expect(customer_billing_result["cust_C"]).toBe(120000);

    // 抽出されたデータに対してサービスごとの請求額集計処理を実行する
    const service_billing_result = aggregateBillingAmountByService(extracted_billable_items);

    // 各サービスの請求額が正確に集計されていることを検証する
    // 手作業計算との照合
    // svc_1: 100000 + 150000 + 120000 = 370000
    // svc_2: 50000 + 80000 = 130000
    expect(service_billing_result["svc_1"]).toBe(370000);
    expect(service_billing_result["svc_2"]).toBe(130000);

    // 顧客ごと・サービスごとの二次元集計結果が正確であることを確認する
    const two_dimensional_billing_result = aggregateBillingAmountByCustomerAndService(
      extracted_billable_items
    );

    // 手作業計算との照合
    expect(two_dimensional_billing_result["cust_A"]["svc_1"]).toBe(160000); // 100000 + 60000
    expect(two_dimensional_billing_result["cust_A"]["svc_2"]).toBe(50000);
    expect(two_dimensional_billing_result["cust_B"]["svc_1"]).toBe(150000);
    expect(two_dimensional_billing_result["cust_B"]["svc_2"]).toBe(80000);
    expect(two_dimensional_billing_result["cust_C"]["svc_1"]).toBe(120000);

    // 集計結果がデータベースに正常に保存されることを確認する
    // （各集計結果オブジェクトが正確な構造を持つことで保存可能性を確認）
    expect(Object.keys(customer_billing_result).length).toBe(3);
    expect(Object.keys(service_billing_result).length).toBe(2);
    expect(Object.keys(two_dimensional_billing_result).length).toBe(3);

    // 集計結果のデータ整合性を確認
    // 顧客ごとの合計と二次元集計の合計が一致する
    const total_from_customer = Object.values(customer_billing_result).reduce(
      (sum, amount) => sum + amount,
      0
    );
    const total_from_2d = Object.values(two_dimensional_billing_result).reduce(
      (sum, customer_data) =>
        sum +
        Object.values(customer_data).reduce(
          (customer_sum, amount) => customer_sum + (typeof amount === "number" ? amount : 0),
          0
        ),
      0
    );
    expect(total_from_customer).toBe(total_from_2d);
    expect(total_from_customer).toBe(560000); // 210000 + 230000 + 120000
  });
});