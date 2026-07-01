import { validateSalesData } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  // SCEN-675: [edge] 営業データ品質自動検証機能 - 検証ルール条件が空（条件なし）の場合、検証がスキップされる
  test("検証ルール条件が空の場合、検証がスキップされ、ログに記録される", () => {
    const validation_rule_no_condition = {
      rule_id: "RULE-001",
      rule_name: "テスト_条件なし",
      conditions: [] as any[],
      enabled: true,
      created_at: new Date("2024-01-15T09:00:00Z"),
    };

    const validation_rule_with_condition = {
      rule_id: "RULE-002",
      rule_name: "テスト_条件あり",
      conditions: [
        {
          condition_id: "COND-001",
          field_name: "customer_name",
          operator: "required",
          expected_value: null,
        },
      ],
      enabled: true,
      created_at: new Date("2024-01-15T09:00:00Z"),
    };

    const sales_data = {
      data_id: "DATA-001",
      customer_name: "",
      transaction_date: "2024-01-15",
      amount: 50000,
      service_type: "サービスA",
    };

    const validation_rules = [
      validation_rule_no_condition,
      validation_rule_with_condition,
    ];

    const result = validateSalesData(sales_data, validation_rules);

    // 検証結果のスキップエントリ確認
    expect(result.executed_rules).toContainEqual({
      rule_id: "RULE-001",
      status: "skipped",
      reason: "条件なし",
      timestamp: expect.any(String),
    });

    // 有効な検証ルール（条件あり）は実行されること
    expect(result.executed_rules).toContainEqual({
      rule_id: "RULE-002",
      status: "failed",
      reason: "customer_name は必須項目です",
      timestamp: expect.any(String),
    });

    // 総合結果は検証失敗（条件ありのルールで失敗）
    expect(result.passed).toBe(false);

    // 実行ルール数は2（スキップされたものも含める）
    expect(result.executed_rules).toHaveLength(2);

    // スキップされたルール数
    expect(
      result.executed_rules.filter((r) => r.status === "skipped")
    ).toHaveLength(1);

    // 実行されたルール数
    expect(
      result.executed_rules.filter(
        (r) => r.status === "failed" || r.status === "passed"
      )
    ).toHaveLength(1);
  });
});