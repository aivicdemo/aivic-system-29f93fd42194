import {
  validateSalesDataByRules,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証ルール - 境界値判定", () => {
  // SCEN-1372
  test("検証ルール条件の境界値入力データが正確に判定される", () => {
    // 検証ルール定義: 金額 >= 1000000 かつ 金額 < 10000000
    const validationRule = {
      rule_id: "rule_boundary_001",
      rule_name: "金額範囲チェック",
      conditions: [
        {
          condition_id: "cond_lower_bound",
          field_name: "amount",
          operator: "gte",
          value: 1000000,
        },
        {
          condition_id: "cond_upper_bound",
          field_name: "amount",
          operator: "lt",
          value: 10000000,
        },
      ],
      logic_operator: "and",
    };

    // テストケース 1: 下限の直前（999999）→ 不合格
    const input_below_lower = {
      amount: 999999,
      customer_id: "cust_001",
      service_type: "service_A",
    };
    const result_below_lower = validateSalesDataByRules(
      input_below_lower,
      validationRule
    );
    expect(result_below_lower.is_valid).toBe(false);
    expect(result_below_lower.failed_conditions).toContain("cond_lower_bound");

    // テストケース 2: 下限の境界値（1000000）→ 合格
    const input_at_lower = {
      amount: 1000000,
      customer_id: "cust_001",
      service_type: "service_A",
    };
    const result_at_lower = validateSalesDataByRules(
      input_at_lower,
      validationRule
    );
    expect(result_at_lower.is_valid).toBe(true);
    expect(result_at_lower.failed_conditions.length).toBe(0);

    // テストケース 3: 範囲内の中央値（5000000）→ 合格
    const input_middle = {
      amount: 5000000,
      customer_id: "cust_001",
      service_type: "service_A",
    };
    const result_middle = validateSalesDataByRules(input_middle, validationRule);
    expect(result_middle.is_valid).toBe(true);
    expect(result_middle.failed_conditions.length).toBe(0);

    // テストケース 4: 上限の直前（9999999）→ 合格
    const input_below_upper = {
      amount: 9999999,
      customer_id: "cust_001",
      service_type: "service_A",
    };
    const result_below_upper = validateSalesDataByRules(
      input_below_upper,
      validationRule
    );
    expect(result_below_upper.is_valid).toBe(true);
    expect(result_below_upper.failed_conditions.length).toBe(0);

    // テストケース 5: 上限の境界値（10000000）→ 不合格
    const input_at_upper = {
      amount: 10000000,
      customer_id: "cust_001",
      service_type: "service_A",
    };
    const result_at_upper = validateSalesDataByRules(
      input_at_upper,
      validationRule
    );
    expect(result_at_upper.is_valid).toBe(false);
    expect(result_at_upper.failed_conditions).toContain("cond_upper_bound");

    // テストケース 6: 上限を超過した値（10000001）→ 不合格
    const input_above_upper = {
      amount: 10000001,
      customer_id: "cust_001",
      service_type: "service_A",
    };
    const result_above_upper = validateSalesDataByRules(
      input_above_upper,
      validationRule
    );
    expect(result_above_upper.is_valid).toBe(false);
    expect(result_above_upper.failed_conditions).toContain("cond_upper_bound");
  });
});