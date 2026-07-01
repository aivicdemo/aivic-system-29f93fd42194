import { validateContractConsistency } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  test("SCEN-920: 契約内容との整合性検証機能 - 契約書の請求対象項目・金額・納期がすべて営業データから生成された請求額・報告内容と一致している", () => {
    // テストケース1: 単一サービス、単一金額、単一納期の基本パターン
    const contract_1 = {
      contract_id: "C001",
      customer_id: "CUST001",
      service_id: "SVC001",
      billing_items: ["apo_count", "deal_count"],
      unit_price: 10000,
      expected_billing_amount: 100000,
      expected_delivery_date: "2024-01-31",
    };

    const salesData_1 = {
      contract_id: "C001",
      apo_count: 10,
      deal_count: 0,
      calculated_billing_amount: 100000,
      billing_items: ["apo_count", "deal_count"],
      delivery_date: "2024-01-31",
    };

    const result_1 = validateContractConsistency(contract_1, salesData_1);
    expect(result_1).toEqual({
      is_consistent: true,
      contract_id: "C001",
      amount_match: true,
      expected_amount: 100000,
      calculated_amount: 100000,
      items_match: true,
      expected_items: ["apo_count", "deal_count"],
      calculated_items: ["apo_count", "deal_count"],
      delivery_date_match: true,
      expected_delivery_date: "2024-01-31",
      calculated_delivery_date: "2024-01-31",
      validation_status: "一致",
    });

    // テストケース2: 複数サービス、複数金額パターン
    const contract_2 = {
      contract_id: "C002",
      customer_id: "CUST002",
      service_id: "SVC002",
      billing_items: ["apo_count", "deal_count", "customer_response"],
      unit_price: 15000,
      expected_billing_amount: 300000,
      expected_delivery_date: "2024-02-28",
    };

    const salesData_2 = {
      contract_id: "C002",
      apo_count: 15,
      deal_count: 5,
      customer_response: 0,
      calculated_billing_amount: 300000,
      billing_items: ["apo_count", "deal_count", "customer_response"],
      delivery_date: "2024-02-28",
    };

    const result_2 = validateContractConsistency(contract_2, salesData_2);
    expect(result_2).toEqual({
      is_consistent: true,
      contract_id: "C002",
      amount_match: true,
      expected_amount: 300000,
      calculated_amount: 300000,
      items_match: true,
      expected_items: ["apo_count", "deal_count", "customer_response"],
      calculated_items: ["apo_count", "deal_count", "customer_response"],
      delivery_date_match: true,
      expected_delivery_date: "2024-02-28",
      calculated_delivery_date: "2024-02-28",
      validation_status: "一致",
    });

    // テストケース3: 異なる顧客、異なる単価パターン
    const contract_3 = {
      contract_id: "C003",
      customer_id: "CUST003",
      service_id: "SVC003",
      billing_items: ["apo_count"],
      unit_price: 20000,
      expected_billing_amount: 200000,
      expected_delivery_date: "2024-03-31",
    };

    const salesData_3 = {
      contract_id: "C003",
      apo_count: 10,
      calculated_billing_amount: 200000,
      billing_items: ["apo_count"],
      delivery_date: "2024-03-31",
    };

    const result_3 = validateContractConsistency(contract_3, salesData_3);
    expect(result_3).toEqual({
      is_consistent: true,
      contract_id: "C003",
      amount_match: true,
      expected_amount: 200000,
      calculated_amount: 200000,
      items_match: true,
      expected_items: ["apo_count"],
      calculated_items: ["apo_count"],
      delivery_date_match: true,
      expected_delivery_date: "2024-03-31",
      calculated_delivery_date: "2024-03-31",
      validation_status: "一致",
    });

    // エラーテスト: 金額不一致の場合
    const contract_error_amount = {
      contract_id: "C004",
      customer_id: "CUST004",
      service_id: "SVC004",
      billing_items: ["apo_count"],
      unit_price: 10000,
      expected_billing_amount: 100000,
      expected_delivery_date: "2024-04-30",
    };

    const salesData_error_amount = {
      contract_id: "C004",
      apo_count: 10,
      calculated_billing_amount: 150000,
      billing_items: ["apo_count"],
      delivery_date: "2024-04-30",
    };

    expect(() =>
      validateContractConsistency(contract_error_amount, salesData_error_amount)
    ).toThrow(/金額/);

    // エラーテスト: 請求対象項目不一致の場合
    const contract_error_items = {
      contract_id: "C005",
      customer_id: "CUST005",
      service_id: "SVC005",
      billing_items: ["apo_count", "deal_count"],
      unit_price: 10000,
      expected_billing_amount: 100000,
      expected_delivery_date: "2024-05-31",
    };

    const salesData_error_items = {
      contract_id: "C005",
      apo_count: 10,
      calculated_billing_amount: 100000,
      billing_items: ["apo_count"],
      delivery_date: "2024-05-31",
    };

    expect(() =>
      validateContractConsistency(contract_error_items, salesData_error_items)
    ).toThrow(/項目/);

    // エラーテスト: 納期不一致の場合
    const contract_error_date = {
      contract_id: "C006",
      customer_id: "CUST006",
      service_id: "SVC006",
      billing_items: ["apo_count"],
      unit_price: 10000,
      expected_billing_amount: 100000,
      expected_delivery_date: "2024-06-30",
    };

    const salesData_error_date = {
      contract_id: "C006",
      apo_count: 10,
      calculated_billing_amount: 100000,
      billing_items: ["apo_count"],
      delivery_date: "2024-06-15",
    };

    expect(() =>
      validateContractConsistency(contract_error_date, salesData_error_date)
    ).toThrow(/納期/);

    // テストケース4: ゼロ金額パターン（正常系）
    const contract_4 = {
      contract_id: "C007",
      customer_id: "CUST007",
      service_id: "SVC007",
      billing_items: ["apo_count"],
      unit_price: 0,
      expected_billing_amount: 0,
      expected_delivery_date: "2024-07-31",
    };

    const salesData_4 = {
      contract_id: "C007",
      apo_count: 0,
      calculated_billing_amount: 0,
      billing_items: ["apo_count"],
      delivery_date: "2024-07-31",
    };

    const result_4 = validateContractConsistency(contract_4, salesData_4);
    expect(result_4).toEqual({
      is_consistent: true,
      contract_id: "C007",
      amount_match: true,
      expected_amount: 0,
      calculated_amount: 0,
      items_match: true,
      expected_items: ["apo_count"],
      calculated_items: ["apo_count"],
      delivery_date_match: true,
      expected_delivery_date: "2024-07-31",
      calculated_delivery_date: "2024-07-31",
      validation_status: "一致",
    });
  });
});