import { validateSalesDataAgainstRules } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行", () => {
  // SCEN-1337: [edge] ルール条件のボーダーライン値（等号境界）が正しく判定される
  test("売上金額の等号境界値（100,000円）で承認フロー実行判定が正確に機能する", () => {
    // 定義：売上金額が100,000円以上の場合、承認フローを実行するルール条件
    const ruleCondition = {
      rule_id: "R001",
      operator: "gte", // greater than or equal
      threshold_value: 100000,
      action: "execute_approval_flow",
    };

    // テストデータ1: 99,999円（境界値未満）
    const test_data_1 = {
      sales_amount: 99999,
      customer_name: "Customer A",
      transaction_date: "2024-01-15",
    };

    const result_1 = validateSalesDataAgainstRules(test_data_1, ruleCondition);
    expect(result_1).toEqual({
      is_valid: false,
      rule_matched: false,
      action_executed: false,
      message: "ルール条件を満たしません。スキップされました。",
    });

    // テストデータ2: 100,000円（等号境界値）
    const test_data_2 = {
      sales_amount: 100000,
      customer_name: "Customer B",
      transaction_date: "2024-01-15",
    };

    const result_2 = validateSalesDataAgainstRules(test_data_2, ruleCondition);
    expect(result_2).toEqual({
      is_valid: true,
      rule_matched: true,
      action_executed: true,
      message: "ルール条件を満たしました。承認フローが実行されます。",
    });

    // テストデータ3: 100,001円（境界値超過）
    const test_data_3 = {
      sales_amount: 100001,
      customer_name: "Customer C",
      transaction_date: "2024-01-15",
    };

    const result_3 = validateSalesDataAgainstRules(test_data_3, ruleCondition);
    expect(result_3).toEqual({
      is_valid: true,
      rule_matched: true,
      action_executed: true,
      message: "ルール条件を満たしました。承認フローが実行されます。",
    });

    // 境界値判定の正確性を確認: 99,999円はスキップ、100,000円以上は承認フロー実行
    expect(result_1.rule_matched).toBe(false);
    expect(result_2.rule_matched).toBe(true);
    expect(result_3.rule_matched).toBe(true);
  });
});