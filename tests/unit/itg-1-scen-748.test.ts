import { extractBillingDataWithRuleValidation } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  test("SCEN-748: 請求ルールが矛盾または重複する場合、エラーが適切に報告される", () => {
    const contradictoryRules = [
      {
        rule_id: "rule_001",
        customer_id: "cust_A",
        billing_frequency: "monthly",
        service_id: "svc_001",
        base_amount: 10000,
        discount_rate: 0,
      },
      {
        rule_id: "rule_002",
        customer_id: "cust_A",
        billing_frequency: "weekly",
        service_id: "svc_001",
        base_amount: 5000,
        discount_rate: 0,
      },
    ];

    const duplicateRules = [
      {
        rule_id: "rule_003",
        customer_id: "cust_B",
        billing_period_start: "2024-01-01",
        billing_period_end: "2024-01-31",
        service_id: "svc_002",
        base_amount: 20000,
        discount_rate: 0,
      },
      {
        rule_id: "rule_004",
        customer_id: "cust_B",
        billing_period_start: "2024-01-01",
        billing_period_end: "2024-01-31",
        service_id: "svc_002",
        base_amount: 15000,
        discount_rate: 0.1,
      },
    ];

    const input_contradictory = {
      sales_data: [
        {
          customer_id: "cust_A",
          service_id: "svc_001",
          transaction_date: "2024-01-15",
          amount: 10000,
          quantity: 1,
        },
      ],
      billing_rules: contradictoryRules,
    };

    const input_duplicate = {
      sales_data: [
        {
          customer_id: "cust_B",
          service_id: "svc_002",
          transaction_date: "2024-01-15",
          amount: 20000,
          quantity: 2,
        },
      ],
      billing_rules: duplicateRules,
    };

    expect(() =>
      extractBillingDataWithRuleValidation(input_contradictory)
    ).toThrow(/矛盾/);

    expect(() =>
      extractBillingDataWithRuleValidation(input_duplicate)
    ).toThrow(/重複/);

    const invalidInput = {
      sales_data: [],
      billing_rules: contradictoryRules,
    };

    try {
      extractBillingDataWithRuleValidation(invalidInput);
      fail("エラーが発生するべき");
    } catch (error: any) {
      expect(error.message).toMatch(/rule_001|rule_002/);
      expect(error.message).toMatch(/billing_frequency|矛盾/);
    }

    const recoverableInput = {
      sales_data: [
        {
          customer_id: "cust_C",
          service_id: "svc_003",
          transaction_date: "2024-01-20",
          amount: 5000,
          quantity: 1,
        },
      ],
      billing_rules: [
        {
          rule_id: "rule_005",
          customer_id: "cust_C",
          billing_frequency: "monthly",
          service_id: "svc_003",
          base_amount: 5000,
          discount_rate: 0,
        },
      ],
    };

    const result = extractBillingDataWithRuleValidation(recoverableInput);
    expect(result).toBeDefined();
    expect(result.billing_summary).toBeDefined();
    expect(Array.isArray(result.billing_summary)).toBe(true);
    expect(result.errors).toBeUndefined();
  });
});