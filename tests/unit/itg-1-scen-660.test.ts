import { describe, test, expect } from "@jest/globals";
import { validateAndAggregateByCustomerService } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  test("SCEN-660: 複数顧客・複数サービスの場合でも、集計ルールに基づいて正確に分離される", () => {
    // テストデータ: 3社以上の顧客と各顧客に対して2種類以上のサービス
    const sales_data = [
      {
        customer_id: "CUST_A",
        service_id: "SVC_1",
        sales_amount: 100000,
        appointment_count: 5,
        contract_count: 2,
      },
      {
        customer_id: "CUST_A",
        service_id: "SVC_2",
        sales_amount: 150000,
        appointment_count: 8,
        contract_count: 3,
      },
      {
        customer_id: "CUST_B",
        service_id: "SVC_1",
        sales_amount: 200000,
        appointment_count: 10,
        contract_count: 4,
      },
      {
        customer_id: "CUST_B",
        service_id: "SVC_2",
        sales_amount: 120000,
        appointment_count: 6,
        contract_count: 2,
      },
      {
        customer_id: "CUST_C",
        service_id: "SVC_1",
        sales_amount: 180000,
        appointment_count: 9,
        contract_count: 3,
      },
    ];

    const aggregation_rules = {
      CUST_A: {
        SVC_1: { sales_weight: 1.0, appointment_weight: 0.5, contract_weight: 2.0 },
        SVC_2: { sales_weight: 1.0, appointment_weight: 0.5, contract_weight: 2.0 },
      },
      CUST_B: {
        SVC_1: { sales_weight: 1.0, appointment_weight: 0.5, contract_weight: 2.0 },
        SVC_2: { sales_weight: 1.0, appointment_weight: 0.5, contract_weight: 2.0 },
      },
      CUST_C: {
        SVC_1: { sales_weight: 1.0, appointment_weight: 0.5, contract_weight: 2.0 },
      },
    };

    // 集計ルール検証機能を実行
    const aggregation_result = validateAndAggregateByCustomerService(
      sales_data,
      aggregation_rules
    );

    // 顧客A-サービス1の集計値を抽出
    const cust_a_svc_1 = aggregation_result.find(
      (item) => item.customer_id === "CUST_A" && item.service_id === "SVC_1"
    );

    // 顧客A-サービス2の集計値を抽出
    const cust_a_svc_2 = aggregation_result.find(
      (item) => item.customer_id === "CUST_A" && item.service_id === "SVC_2"
    );

    // 顧客B-サービス1の集計値を抽出
    const cust_b_svc_1 = aggregation_result.find(
      (item) => item.customer_id === "CUST_B" && item.service_id === "SVC_1"
    );

    // 顧客B-サービス2の集計値を抽出
    const cust_b_svc_2 = aggregation_result.find(
      (item) => item.customer_id === "CUST_B" && item.service_id === "SVC_2"
    );

    // 顧客C-サービス1の集計値を抽出
    const cust_c_svc_1 = aggregation_result.find(
      (item) => item.customer_id === "CUST_C" && item.service_id === "SVC_1"
    );

    // 期待値の計算: aggregated_value = (sales_amount * sales_weight) + (appointment_count * appointment_weight) + (contract_count * contract_weight)
    const expected_cust_a_svc_1 = 100000 * 1.0 + 5 * 0.5 + 2 * 2.0; // 100002.5
    const expected_cust_a_svc_2 = 150000 * 1.0 + 8 * 0.5 + 3 * 2.0; // 150010
    const expected_cust_b_svc_1 = 200000 * 1.0 + 10 * 0.5 + 4 * 2.0; // 200013
    const expected_cust_b_svc_2 = 120000 * 1.0 + 6 * 0.5 + 2 * 2.0; // 120007
    const expected_cust_c_svc_1 = 180000 * 1.0 + 9 * 0.5 + 3 * 2.0; // 180010.5

    // 各顧客・サービス組み合わせの集計値が定義された集計ルールに従って計算されているか検証
    expect(cust_a_svc_1).toBeDefined();
    expect(cust_a_svc_1!.aggregated_value).toBe(expected_cust_a_svc_1);

    expect(cust_a_svc_2).toBeDefined();
    expect(cust_a_svc_2!.aggregated_value).toBe(expected_cust_a_svc_2);

    expect(cust_b_svc_1).toBeDefined();
    expect(cust_b_svc_1!.aggregated_value).toBe(expected_cust_b_svc_1);

    expect(cust_b_svc_2).toBeDefined();
    expect(cust_b_svc_2!.aggregated_value).toBe(expected_cust_b_svc_2);

    expect(cust_c_svc_1).toBeDefined();
    expect(cust_c_svc_1!.aggregated_value).toBe(expected_cust_c_svc_1);

    // 異なる顧客間のデータが混在していないか確認
    const cust_a_items = aggregation_result.filter(
      (item) => item.customer_id === "CUST_A"
    );
    const cust_b_items = aggregation_result.filter(
      (item) => item.customer_id === "CUST_B"
    );
    const cust_c_items = aggregation_result.filter(
      (item) => item.customer_id === "CUST_C"
    );

    expect(cust_a_items.length).toBe(2);
    expect(cust_b_items.length).toBe(2);
    expect(cust_c_items.length).toBe(1);

    expect(
      cust_a_items.every((item) => item.customer_id === "CUST_A")
    ).toBe(true);
    expect(
      cust_b_items.every((item) => item.customer_id === "CUST_B")
    ).toBe(true);
    expect(
      cust_c_items.every((item) => item.customer_id === "CUST_C")
    ).toBe(true);

    // 異なるサービス間のデータが混在していないか確認
    const svc_1_items = aggregation_result.filter(
      (item) => item.service_id === "SVC_1"
    );
    const svc_2_items = aggregation_result.filter(
      (item) => item.service_id === "SVC_2"
    );

    expect(svc_1_items.length).toBe(3);
    expect(svc_2_items.length).toBe(2);

    expect(
      svc_1_items.every((item) => item.service_id === "SVC_1")
    ).toBe(true);
    expect(
      svc_2_items.every((item) => item.service_id === "SVC_2")
    ).toBe(true);

    // 重複がないことを確認
    const unique_combinations = new Set(
      aggregation_result.map(
        (item) => `${item.customer_id}_${item.service_id}`
      )
    );
    expect(unique_combinations.size).toBe(aggregation_result.length);

    // 全体の集計数が正確であることを確認
    expect(aggregation_result.length).toBe(5);
  });
});